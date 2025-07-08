const LEAST_LEVEL = 138;
// 定义兑换规则
const EXCHANGE_RULES = [
  { to: 139, from: 138, count: 4 },
  { to: 140, from: 139, count: 8 },
  { to: 141, from: 140, count: 4 },
  { to: 142, from: 141, count: 8 },
  { to: 143, from: 142, count: 3 },
  { to: 144, from: 143, count: 2 },
  { to: 145, from: 144, count: 2 },
  { to: 146, from: 145, count: 3 },
  { to: 147, from: 146, count: 2 },
  { to: 148, from: 147, count: 2 },
  { to: 149, from: 148, count: 2 },
];
const EXCHANGE_RULES_TO_MAP = EXCHANGE_RULES.reduce((acc, _) => {
  acc[_.to] = _;
  return acc;
}, {});

// 导航栏组件
const NavBar = () => {
  return (
    <header className="nav-bar">
      <div className="container">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <i className="fa-calculator text-white text-2xl mr-3"></i>
            <h1 className="nav-title">材料兑换计算器</h1>
          </div>
          <nav className="hidden md:block">
            <ul className="flex gap-6">
              <li>
                <a
                  href="#"
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  首页
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  使用指南
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  常见问题
                </a>
              </li>
            </ul>
          </nav>
          <button className="md:hidden text-white text-xl">
            <i className="fa-bars"></i>
          </button>
        </div>
      </div>
    </header>
  );
};

// 材料输入行组件
const MaterialInputRow = ({
  level,
  count,
  onRemove,
  targetLevel,
  onLevelChange,
  onCountChange,
}) => {
  // 生成可选的等级选项
  const levelOptions = Array.from(
    { length: targetLevel - LEAST_LEVEL },
    (_, i) => i + LEAST_LEVEL
  );

  return (
    <div className="material-input-row">
      <select
        className="input select material-input"
        value={level}
        onChange={(e) => onLevelChange(e, level)}
      >
        {levelOptions.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>
      <input
        type="number"
        min="0"
        value={count}
        className="input material-input"
        onChange={(e) => onCountChange(e, level)}
      />
      <i class="fa-solid fa-xmark remove-btn" onClick={onRemove}></i>
    </div>
  );
};

// 主组件
class MaterialExchangeCalculator extends React.Component {
  constructor(props) {
    super(props);
    this.state = this.createState();
  }

  createState = () => {
    const { __id = -1, caches = [] } = this.state || {};

    return {
      caches: caches,
      __id: __id + 1,
      targetLevel: 141,
      materialInputs: [
        { level: 140, count: 2, id: "1" },
        { level: 139, count: 1, id: "2" },
        { level: 138, count: 1, id: "3" },
      ],
      resultVisible: false,
      resultTarget: 141,
      resultMaterials: "",
      savings: {},
      normalMaterials: {},
    };
  };

  componentDidMount() {
    // window._t = this;
    this.handleCalculate();
  }

  createMaterialId = () => Math.random().toString(36).slice(2);

  handleAddMaterial = () => {
    this.setState((prevState) => ({
      materialInputs: [
        ...prevState.materialInputs,
        {
          level: prevState.targetLevel - 1,
          count: 1,
          id: this.createMaterialId(),
        },
      ],
    }));
  };

  handleRemoveMaterial = (id) => {
    this.setState((prevState) => ({
      materialInputs: prevState.materialInputs.filter((_) => id !== _.id),
    }));
  };

  handleTargetLevelChange = (e) => {
    const targetLevel = parseInt(e.target.value);
    this.setState({
      __id: this.state.__id + 1,
      targetLevel,
      materialInputs: Array.from(
        { length: targetLevel - LEAST_LEVEL },
        (_, i) => ({
          level: targetLevel - 1 - i,
          count: 0,
          id: this.createMaterialId(),
        })
      ),
    });
  };

  handleLevelChange = (e, originalLevel, id) => {
    const newLevel = parseInt(e.target.value);
    this.setState((prevState) => {
      const updatedInputs = prevState.materialInputs.map((input) => {
        if (input.id === id) {
          return { ...input, level: newLevel };
        }
        return input;
      });
      return { materialInputs: updatedInputs };
    });
  };

  handleCountChange = (e, level, id) => {
    const count = parseInt(e.target.value) || 0;
    this.setState((prevState) => {
      const updatedInputs = prevState.materialInputs.map((input) => {
        if (input.id === id) {
          return { ...input, count };
        }
        return input;
      });
      return { materialInputs: updatedInputs };
    });
  };

  handleCalculate = () => {
    const targetLevel = this.state.targetLevel;
    const specialMaterials = {};

    this.state.materialInputs.forEach(({ level, count }) => {
      if (count > 0) {
        if (specialMaterials[level]) {
          specialMaterials[level] += count;
        } else {
          specialMaterials[level] = count;
        }
      }
    });

    // 验证输入
    if (Object.keys(specialMaterials).length === 0) {
      // 更新状态
      this.setState(
        {
          resultVisible: false,
        },
        () => {
          this.drawSavingsChart();
        }
      );
      return;
    }

    // 计算使用特价材料后节省的材料
    const savings = this.calculateSavings(targetLevel, specialMaterials);
    // 计算普通兑换所需材料
    const normalMaterials = this.calculateNormalMaterials(
      savings,
      specialMaterials
    );

    // 更新状态
    this.setState(
      {
        resultVisible: true,
        resultTarget: targetLevel,
        resultMaterials: Object.entries(specialMaterials)
          .map(([level, count]) => `${count}个${level}`)
          .join(", "),
        savings,
        normalMaterials,
      },
      () => {
        this.drawSavingsChart();
      }
    );
  };

  calculateSavings = (targetLevel, specialMaterials) => {
    const __specialMaterials = { ...specialMaterials };
    // 初始化节省结果
    const __savings = {};
    let level = Math.min(...Object.keys(__specialMaterials).map((_) => +_));

    //   console.log("smallest level", level);

    // 对于每种特价材料，计算其节省的效果
    while (level < targetLevel) {
      const count = __specialMaterials[level];

      if (count) {
        // 计算该等级材料在普通兑换路径中的节省
        const supplementInfo = this.calculateLevelSupplement(level, count);

        //   console.log("level supplementInfo", level, supplementInfo);

        if (supplementInfo) {
          __savings[level] = supplementInfo.supplement;

          if (__specialMaterials[supplementInfo.to]) {
            __specialMaterials[supplementInfo.to] += supplementInfo.toX;
          } else {
            __specialMaterials[supplementInfo.to] = supplementInfo.toX;
          }
        }
      }

      ++level;
    }

    return __savings;
  };

  calculateLevelSupplement = (level, count) => {
    // 获取该等级材料的兑换规则
    const rule = EXCHANGE_RULES.find((_) => +_.from === +level);
    if (!rule) return null;

    const toLevel = rule.to;
    const fromCount = rule.count;

    const supplement =
      fromCount - (count > fromCount ? count % fromCount : count);
    const toX = Math.ceil(count / fromCount);

    return {
      to: toLevel,
      toX,
      supplement,
    };
  };

  calculateNormalMaterials = (savings, specialMaterials) => {
    const __normalMaterials = { ...savings };
    Object.entries(specialMaterials).forEach(([level, count]) => {
      if (__normalMaterials[level]) {
        __normalMaterials[level] += count;
      } else {
        __normalMaterials[level] = count;
      }
    });
    return __normalMaterials;
  };

  calculateBase138Count = (level, count) => {
    let currentLevel = +level;
    let currentCount = count;

    // 从给定的等级开始，逐步向下转换，直到回到138级
    while (currentLevel > LEAST_LEVEL) {
      // 找到当前等级的转换规则
      const rule = EXCHANGE_RULES_TO_MAP[currentLevel];

      // 计算前一个等级的数量
      currentCount *= rule.count;
      currentLevel = rule.from;
    }

    return currentCount;
  };

  to138Count = (map) => {
    return Object.entries(map).reduce((acc, [level, count]) => {
      return (acc += this.calculateBase138Count(level, count));
    }, 0);
  };

  drawSavingsChart = () => {
    const ctxElement = document.getElementById("savingsChart");
    if (!ctxElement) return;
    const savings = this.state.savings;
    const normalMaterials = this.state.normalMaterials;
    const ctx = ctxElement.getContext("2d");

    // 如果已有图表实例，销毁它
    if (this.savingsChart) {
      this.savingsChart.destroy();
    }

    const normalMaterialsAllCount = this.to138Count(normalMaterials);
    const savingsAllCount = this.to138Count(savings);

    const __target = EXCHANGE_RULES_TO_MAP[this.state.targetLevel];

    // 准备图表数据
    const labels = [
      `原价兑换${__target.to}需要${__target.count}个${__target.from}`,
      "相对于原价兑换节省了约",
    ];
    const data = [
      "100",
      ((savingsAllCount / normalMaterialsAllCount) * 100).toFixed(1),
    ];
    const backgroundColors = [
      "rgba(22, 93, 255, 0.7)", // 主色调 - 蓝色
      "rgba(255, 125, 0, 0.7)", // 辅助色 - 橙色
      "rgba(16, 185, 129, 0.7)", // 绿色
      "rgba(126, 34, 206, 0.7)", // 紫色
      "rgba(245, 158, 11, 0.7)", // 黄色
      "rgba(239, 68, 68, 0.7)", // 红色
      "rgba(107, 114, 128, 0.7)", // 灰色
    ];

    // 创建图表
    this.savingsChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: backgroundColors.slice(0, labels.length),
            borderColor: "white",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: {
              boxWidth: 15,
              padding: 15,
              font: {
                family: "Inter",
                size: 12,
              },
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || "";
                const value = context.raw || 0;
                return `${label}: ${value}%`;
              },
            },
          },
        },
        animation: {
          animateScale: true,
          animateRotate: true,
          duration: 2000,
          easing: "easeOutQuart",
        },
      },
    });
  };

  saveThisResult = () => {
    const { caches, ...otherState } = this.state;
    this.setState({
      ...this.createState(),
      caches: [...caches, otherState],
    });
  };

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.targetLevel !== this.state.targetLevel ||
      JSON.stringify(prevState.materialInputs) !==
        JSON.stringify(this.state.materialInputs)
    ) {
      this.handleCalculate();
    }
  }

  render() {
    const {
      caches,
      targetLevel,
      materialInputs,
      resultVisible,
      resultTarget,
      resultMaterials,
      savings,
      normalMaterials,
    } = this.state;

    const cachesLen = caches.length;
    const hasCache = cachesLen > 0;

    return (
      <div>
        <NavBar />
        <main className="container py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* 输入区域 */}
            <div className={`w-full md:w-1/${hasCache ? 3 : 2}`}>
              <div className="card">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">兑换参数设置</h2>
                  <span className="bg-primary/10 text-primary text-xs px-3 py-1 rounded-full">
                    输入区
                  </span>
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="targetLevel"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square text-primary mr-1"></i>
                    兑换目标等级
                  </label>
                  <select
                    id="targetLevel"
                    className="input select"
                    value={targetLevel}
                    onChange={this.handleTargetLevelChange}
                  >
                    {EXCHANGE_RULES.map((_, index) => (
                      <option value={_.to} key={index}>
                        {_.to}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium">特价材料输入</h3>
                    <span className="text-xs text-gray-500">
                      至少输入一种材料
                    </span>
                  </div>
                  <div id="materialInputs">
                    {materialInputs.map(({ level, count, id }, index) => (
                      <MaterialInputRow
                        key={id}
                        level={level}
                        count={count}
                        onRemove={() => this.handleRemoveMaterial(id)}
                        targetLevel={targetLevel}
                        onLevelChange={(e, level) =>
                          this.handleLevelChange(e, level, id)
                        }
                        onCountChange={(e, level) =>
                          this.handleCountChange(e, level, id)
                        }
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={this.handleAddMaterial}
                    className="add-btn"
                  >
                    <i className="fa-solid fa-plus-circle mr-1"></i>
                    添加材料
                  </button>
                </div>

                <button
                  // onClick={this.saveThisResult}
                  className="btn btn-primary w-full"
                >
                  <i className="fa-solid fa-calculator mr-2"></i>
                  自动计算
                </button>
              </div>
            </div>

            {/* 结果区域 */}
            <div className={`w-full md:w-1/${hasCache ? 3 : 2}`}>
              <div className="card">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">节省材料结果</h2>
                  <span className="bg-secondary/10 text-secondary text-xs px-3 py-1 rounded-full">
                    结果区
                  </span>
                </div>

                {resultVisible ? (
                  <div id="resultContainer">
                    <div className="bg-primary/5 rounded-xl p-4 mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-500">
                          兑换目标
                        </span>
                        <span
                          id="resultTarget"
                          className="font-bold text-lg text-primary"
                        >
                          {resultTarget}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-500">
                          使用的特价材料
                        </span>
                        <div id="resultMaterials" className="font-medium">
                          {resultMaterials}
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-3">节省材料统计</h3>
                      <div id="savingList" className="space-y-2">
                        {Object.entries(savings).map(
                          ([level, count], index) => (
                            <div key={index} className="saving-item visible">
                              <span
                                className={`material-icon material-icon-${level}`}
                              >
                                <i className="fa-solid fa-star"></i>
                              </span>
                              <span>{`${count}个${level}`}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <div className="bg-secondary/5 rounded-xl p-4">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">总计节省材料</span>
                          <div className="flex items-center">
                            <i className="fa-solid fa-star text-secondary mr-2"></i>
                            <span
                              id="totalSaving"
                              className="font-bold text-xl text-secondary"
                            >
                              {Object.entries(savings)
                                .filter(([level, count]) => count > 0)
                                .map(([level, count]) => `${count}个${level}`)
                                .join(", ")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-3">节省比例分布</h3>
                      <div
                        id="chartContainer"
                        className="w-full h-48 bg-gray-50 rounded-lg"
                      >
                        <canvas id="savingsChart"></canvas>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div id="initialMessage">
                    <div className="initial-icon">
                      <i className="fa-solid fa-calculator text-primary text-3xl"></i>
                    </div>
                    <h3 className="text-xl font-bold mb-3">请设置兑换参数</h3>
                    <p className="text-gray-500 max-w-md mb-6">
                      输入目标等级和特价材料，点击计算按钮获取节省材料统计
                    </p>
                    <div className="flex space-x-3 text-gray-400">
                      <i className="fa-solid fa-arrow-down animate-bounce"></i>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 缓存区 */}
            {caches.length > 0 && (
              <div className={`w-full md:w-1/${hasCache ? 3 : 2}`}>
                {caches.map((item, idx) => {
                  return (
                    <>
                      <div
                        key={idx}
                        className="bg-primary/5 rounded-xl p-4 mb-6"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-500">
                            兑换目标
                          </span>
                          <span
                            id="resultTarget"
                            className="font-bold text-lg text-primary"
                          >
                            {item.resultTarget}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-500">
                            使用的特价材料
                          </span>
                          <div id="resultMaterials" className="font-medium">
                            {item.resultMaterials}
                          </div>
                        </div>
                      </div>
                      <div className="mb-6">
                        <h3 className="text-lg font-medium mb-3">
                          节省材料统计
                        </h3>
                        <div id="savingList" className="space-y-2">
                          <div key={index} className="saving-item visible">
                            <span
                              className={`material-icon material-icon-${level}`}
                            >
                              <i className="fa-solid fa-star"></i>
                            </span>
                            {Object.entries(item.savings).map(
                              ([level, count], index) => (
                                <span>{`${count}个${level}`}</span>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })}
              </div>
            )}
          </div>
        </main>
        <footer>
          <div className="container">
            <div className="footer-content">
              <div className="footer-section">
                <div className="flex items-center mb-4">
                  <i className="fa-solid fa-calculator text-primary text-2xl mr-3"></i>
                  <span className="text-xl font-bold">材料兑换计算器</span>
                </div>
                <p className="text-gray-400 text-sm">
                  一个高效、易用的材料兑换计算工具，帮助你在游戏中做出最优的资源管理决策。
                </p>
              </div>
              <div className="footer-section">
                <h3 className="footer-title">快速链接</h3>
                <ul className="footer-links">
                  <li>
                    <a href="#">首页</a>
                  </li>
                  <li>
                    <a href="#">使用指南</a>
                  </li>
                  <li>
                    <a href="#">常见问题</a>
                  </li>
                  <li>
                    <a href="#">联系我们</a>
                  </li>
                </ul>
              </div>
              <div className="footer-section">
                <h3 className="footer-title">关注我们</h3>
                <div className="social-links">
                  <a href="#" className="social-link">
                    <i className="fa-github fa-solid"></i>
                  </a>
                  <a href="#" className="social-link">
                    <i className="fa-twitter fa-solid"></i>
                  </a>
                  <a href="#" className="social-link">
                    <i className="fa-linkedin fa-solid"></i>
                  </a>
                </div>
                <p className="text-gray-400 text-sm mt-4">
                  © 2025 材料兑换计算器 版权所有
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }
}

ReactDOM.render(
  <MaterialExchangeCalculator />,
  document.getElementById("root")
);
