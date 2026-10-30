# 1. 架构方案

## 1.1 模块划分

四个产品模块 + 一个测试模块

| 模块           | 职责                                                         |
| -------------- | ------------------------------------------------------------ |
| `src/model/`   | **图形与文档树**。`Shape` 抽象基类、6 个叶子图形、`Group` 容器、`Document`（根 + id 索引）、`ShapeFactory`、两种文本渲染器（`TreeRenderer` / `ShapeDetail`） |
| `src/command/` | **一条命令一个类**：执行 + 撤销 + 回显。`Command`/`Operation` 接口、`UndoManager`（双栈 + IO 锁）、9 个命令类 |
| `src/io/`      | **外部世界**：`FileSystem` 接口 + `NodeFileSystem` 实现、手写 `SvgParser`（SVG 文本 → 文档树） |
| `src/cli/`     | **终端外壳**：`readline` 循环、`Tokenizer`（引号感知切词）、`CommandRegistry`（命令名 → 操作）、`AppContext`（当前文档 + 撤销栈 + 文件路径）、9 个只读/文档类操作 |
| `src/test/`    | 验收测试                                                     |

```
src/
├── model/          Shape.ts  Rect/Circle/Ellipse/Line/TextShape.ts  Group.ts
│                   Document.ts  ShapeFactory.ts  TreeRenderer.ts  ShapeDetail.ts
├── command/        Command.ts  UndoManager.ts
│                   Move/Set/Create/Delete/Scale/Group/Ungroup/AddTo/ReorderCommand.ts
├── io/             FileSystem.ts  SvgParser.ts
├── cli/            index.ts  Repl.ts  Tokenizer.ts  Args.ts  CommandRegistry.ts  AppContext.ts
│   └── commands/   Init/Tree/Show/Undo/Redo/Read/Save/Canvas/HelpOperation.ts
└── test/           Harness.ts  TranscriptData.ts  Transcript/Suite  ErrorSuite  InvariantSuite  run.ts
```

![](D:\A-Study\G1\高级软件开发技术\图1.png)

## 1.2 设计模式的选择

在本次架构中，选择的设计模式核心为Command模式，并辅助使用了Composite模式和Factory模式。

- Command模式

  - 理由：本项目的核心需求是“图形编辑”与“撤销/重做”。如果直接在终端循环里写 `if-else`，撤销逻辑将变得极其混乱（例如移动的逆操作是反向移动，删除的逆操作是恢复整棵子树）。使用 Command 模式，可以将“请求”封装成对象，实现调用者（CLI）与执行者（图形模型）的解耦，并为Undo/Redo提供统一的管理机制。
  - **代码相关**：

  1. Command接口（`src/command/Command.ts`）：定义了 `execute()`、`undo()` 和 `feedback()` 标准接口。
  2. 具体命令类（如 `MoveCommand`、`GroupCommand` 等 9 个类）：每个类实现具体逻辑。例如 `MoveCommand` 在 `execute()` 中记录并改变坐标，在 `undo()` 中执行反向移动；`DeleteCommand` 在 `execute()` 中记录被删除的节点和原父级，在 `undo()` 中将其精准插回原位。
  3. 接收者（`src/model/` 下的 `Shape` 等）：具体命令最终调用的底层模型对象。
  4. 调用者（`src/command/UndoManager.ts` 和 `src/cli/Repl.ts`）：`UndoManager` 维护了 `undoStack` 和 `redoStack`。当用户输入命令时，`Repl` 负责构造对应的 Command 对象，交由 `UndoManager` 压栈并执行；当用户输入 `undo` 时，`UndoManager` 仅需调用栈顶对象的 `undo()` 方法，无需关心具体是什么命令。

- Composite模式

  - 在 `src/model/` 中，叶子图形（如 `Rect`）和容器（`Group`）共同继承自 `Shape` 抽象基类。当执行 `move` 或 `scale` 操作时，`Group` 会递归调用子节点的同名方法。这让 `MoveCommand` 无需编写 `if (type === 'g')` 的判断，实现了对单一图形和组合图形的统一操作。

- Factory模式

  - 按照作业要求，代码中保留了两处按名字分派的地方：
    - `CommandRegistry`（命令工厂）：负责将终端输入的字符串（如 `"move"`）映射为 `MoveCommand` 对象。
    - `ShapeFactory`（图形工厂）：根据类型字符串（如 `"rect"`）创建对应的 `Shape` 子类。

### 没用到的模式及理由

| 模式      | 为什么不用                                                   |
| --------- | ------------------------------------------------------------ |
| Adapter   | 没有需要适配的第三方接口；`FileSystem` 是自定的窄接口（2 个方法），不是包装别人的 API |
| Observer  | 状态变化只有"命令改了模型"一种，且结果的消费方是同步的调用方（REPL 打印），不存在一对多通知 |
| Decorator | 没有"用布尔开关叠加功能"的场景；命令的组合粒度由用户输入决定，不需要运行期套娃 |
| Visitor   | 树的遍历操作是固定的三类（注册索引、渲染树、解析建树），不满足"频繁新增操作"的引入条件。强行引入只会增加间接层 |

## 1.3 依赖方向规则

| 允许                   | 理由                                                         |
| ---------------------- | ------------------------------------------------------------ |
| `cli → command`        | 外壳构造命令对象并执行，方向天然向下                         |
| `cli → io`             | `read`/`save` 是外壳的职责，外壳持有 `FileSystem`            |
| `cli → model`          | 只读列表（`tree`/`show`）需要直接访问文档树                  |
| `command → model`      | 命令操作 Receiver                                            |
| `io → model`           | 解析产物是文档树                                             |
| `test → cli, io`       | 测试在最外层，驱动整个外壳；不进入产品依赖图                 |
| `model` 不依赖任何模块 | 若模型依赖命令，一旦命令逻辑或交互方式发生变动，核心模型就不得不跟着修改 |

## 1.4 变化点假设

**1. 新增一种图形类型（如 polygon、path）**
预留了扩展空间：`Shape` 抽象基类通过 `xKeys`、`yKeys`、`scaleKeys` 以及 `treeAttrs()` 让子类自行声明几何特征，使得 `move`、`scale`、`set`、序列化以及树渲染的全部核心逻辑做到零改动。新增类型只需编写一个新类并在 `ShapeFactory` 中增加一个 `case`。其代价是工厂处仍需按名字分派（未做注册表），这一处已按规范要求标注为“待重构”。

**2. 新增一条编辑命令**
目前 `Command` 接口和 `CommandRegistry` 的注册机制已将命令解耦，增加一条命令只需在 `CommandRegistry` 注册一行，`UndoManager` 完全不需要改动。具体的撤销策略可根据新命令的特性，灵活选用“反向操作”、“快照恢复”或“记录索引”三种模式之一，扩展成本极低。

**3. 显示格式变化（列宽、缩写规则、分组等）**
将渲染逻辑与领域模型彻底分离：`TreeRenderer`（结构树）与 `ShapeDetail`（属性明细）是独立的类，具体的属性拼接由图形类自己实现的 `treeAttrs()` 和 `detailSections()` 提供。这意味着修改显示格式完全不碰模型语义。

**4. 更换存储后端（如从内存换到服务端或浏览器的 localStorage）**
预留了接口，`FileSystem` 被设计为一个仅包含两个方法的极简接口，命令层只依赖此接口。

**5. 插件化复合图形（如后续的 box 类型）**
目前部分预留了扩展点：`ShapeFactory.restore()` 已按标签名建对象，`Document` 也通过 `childShapes()` 递归注册。插件化接入时，只需注册新类型即可。但未预留的是“`data-kind` 标记与读回还原类型”机制，因此现阶段读入外部复合图形时，会自动降级为普通 `<g>` 容器。

# 2. 过程记录

以下是开发中几个AI给出方案，但我依据规范或实测发现不对的地方，每条都能在git历史里找到对应提交。

- tree命令。起初AI按照“固定名字宽度补空格”的思路生成，但发现跟规范5.1的示例完全对不上——rect#bg 后面是 8 个空格，circle#c1 后面只有2个，明显不是固定宽度。用脚本把示例逐字符打印出来量：第一棵树四行的属性列全部落在第 19 列。由此得出规则是"属性列 = 本棵树内树线前缀加名字的最大长度再加 2"，短行补空格、超长行退化为一个空格。用这条规则验证 5.1 的两棵树，逐字符一致。
- group 撤销后顺序颠倒：执行 `group duo a inner` 再 `undo`，子元素顺序从 `[a, b, outer]` 变成了 `[outer, b, a]`。打印每步的状态后，定位到 `GroupCommand` 的快照时机不对——容器占位导致后续元素下标右移，此时记下的“原下标”已经被挤动了。改成在插容器之前先快照，撤销时按升序回填。这让我意识到，撤销类的 bug 往往不是反向操作写错，而是快照时机不对。
- line在tree里多输出了stroke：验收测试跑6.1会话时输出末尾多了一截。用 grep 在规范里找 line 的三处示例，全部只有端点没有样式，于是把线段的树渲染改成只输出端点。这个 bug 是自动化验收抓出来的，肉眼比对时行尾多出的一截非常容易漏。
- Document和Group里用instanceof Group判断"要不要递归子节点"，这正是规范禁止的"用类型判断代替多态"。改成 Shape.childShapes() 无判断遍历之后，顺带发现 Group.findById() 已经成了死代码——Document 早就用 id 索引了，它没有任何调用方——一并删掉。
- 同一个字符在不同上下文里含义不同。文本双重转义是因为属性值走了实体解码而文本节点没走，A &amp; B 存回去就变成 A &amp;amp; B，修法是文本在扫描阶段就解码，保证内容层永远是未转义纯文本、转义只发生在序列化边界。无引号属性值吞斜杠是因为 height=40/> 里的 / 被算进了值，元素被误判为非自闭合，后面的 <g> 差点变成 rect 的孩子，修法是把 / 加进无引号值的终止符。
- 测试本身也会写错。第一次跑验收5项失败，其中3项是断言写错——create 的撤销回显实际是 rect#a creation undone，我凭印象写成了 deleted；"失败的save之后undo应当仍可用"这条把期望写反了。断言值不能凭记忆写。

# 3. 一致性自查

**1. 模块与依赖调整**
*   **取消 `error/` 模块**：方案计划写一个统一的错误类型模块，但最终没建。因为本项目所有错误本质都是“命令失败、状态回滚”，调用方（Repl）只需把文案加上 error: 抛给终端，根本不需要按类型去 catch。为此写十几个异常类纯属徒增文件数。代价就是失去了 TS 层面的异常类型区分，如果以后下游有分类捕获的需求，得再重构。
*   **`ShapeFactory` 位置迁移**：从方案中的 `command/` 移到了 `model/`。原因是 `io/SvgParser` 也需要“标签名 → 图形类”的映射。若工厂留在 command 层，将出现 `io → command` 的反向依赖。移动之后，两处均向下依赖 `model`，依赖方向恢复严格单向。
*   方案未细化的 `cli/commands/` 和 `src/test/` 也实际落地了。前者用于隔离不可撤销的文档类操作（如 init/read/save/canvas），避免污染撤销体系；后者由于 `rootDir` 限定为 `./src`（放外面会触发 TS6059 报错），故置于内部，并配合新增的 `tsconfig.build.json`，在构建时排除测试和手测脚本，确保 `dist` 仅含产品代码。

**2. 依赖方向与分派自查**
*   **依赖方向**：使用 `grep -rn "from '\.\./" src` 枚举了全部跨目录引用。结果与规则逐条吻合：`model` 目录下没有任何 `../` 引用；`command` 和 `io` 只引用 `model`；`cli` 全部向下。运行期不存在循环依赖（`Shape` 对 `Group` 的类型引用编译后擦除）。未发现违规依赖。
*   **按名字分派**：现状确认仅有 `CommandRegistry`（19 条注册）和 `ShapeFactory`（两个 switch 覆盖 6 种图形创建）。使用 `grep "switch" src` 验证，产品代码中再无其它按字符串判断的分派点。两处均已标注“待重构”，计划在插件化阶段改为注册表。

**3. 与规范的偏差**
1.  **6.1树的属性列偏移**：比规范右移了三格。规范示例本身不自洽。选择采用能精确复现5.1两个自洽样本的规则。
2.  **`box` 未实现**：规范明确说这是插件化阶段的目标类型，本阶段执行 `create box` 会抛出带提示的 `unknown shape type` 错误。
3.  **部分错误码不可达**：规范中的 `cannot ungroup composite shape` 在本阶段不可达（因为它针对 box 场景）。`ungroup` 对普通容器和叶子走的两条路径都有用例覆盖。
4.  **`transform` 只存不算**：读入 SVG 时原样保留该属性以避免 round-trip 丢样式，但 `move`/`scale` 不改写它。

# 4. 质量保证手段

整个项目的验收入口是 `npm run test`，目前122 项断言全部通过。

本项目没有引入 Vitest 或 Jest 等测试框架。因为项目的验收入口是纯函数 `Repl.handle(line)`，测试的本质就是“喂一行输入，比对一段文本”。引入框架的配置成本远大于收益，因此自建了一个约五十行的轻量级断言器，失败时能按行号直接定位。

断言主要分为三块：首先是**规范回放（60 项）**，覆盖第 6 章两段完整会话的逐字比对；其次是**报错与状态不变量（38 项）**，全覆盖作业 4.2 节的 12 行报错表格，并且每测完一条报错，都会追发一次 `tree` 命令比对输出，用机器证明“失败不改变状态”；最后是**系统不变量（22 项）**，包括空栈撤销、IO 锁解禁、跨层级重名冲突，以及 `save → read → save` 两份文件逐字节相同等。

**静态检查与构建隔离：**
*   `tsc --noEmit` 保持零报错，且开启 `strict: true` 并覆盖测试文件。
*   构建隔离由 `tsconfig.build.json` 保证，`npm run build` 的产物只包含干净的产品代码。

**人工验证：**
1.  **真实渲染**：把生成的 SVG 拖进浏览器看效果。字符串断言能证明格式正确，但证明不了浏览器认这个 SVG。
2.  **真实终端交互**：自动化测试驱动的是 `Repl.handle()` 纯函数，绕过了 `readline`。所以提示符显示、空行处理、`#` 注释过滤、`quit` 退出以及管道输入的行为，均是实跑确认的。
3.  **外部兼容性**：用带 `transform`、`font-size`、无引号属性、单引号 `viewBox` 的外部 SVG 文件，实测了读入与再保存的兼容性。
