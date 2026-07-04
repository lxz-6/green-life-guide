import { useEffect, useMemo, useState } from "react";
import "./App.css";

const STORAGE_KEY = "green-life-guide-records-v2";

function getCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getMinMonth() {
  const now = new Date();
  const year = now.getFullYear() - 5;
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function parseNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : 0;
}

function formatNumber(value, digits = 2) {
  return Number(value || 0).toFixed(digits);
}

function formatPercent(value, total) {
  if (!total || total <= 0) return "0.0";
  return ((value / total) * 100).toFixed(1);
}

function formatMonth(month) {
  if (!month) return "";
  const [year, m] = month.split("-");
  return `${year}年${Number(m)}月`;
}

function createDefaultForm() {
  return {
    month: getCurrentMonth(),

    electricity: "",
    gas: "",
    water: "",

    walk: "",
    bike: "",
    subway: "",
    bus: "",
    car: "",
    taxi: "",
    train: "",
    flight: "",

    meat: "",
    dairy: "",
    vegetables: "",
    fruit: "",
    takeaway: "",

    express: "",
    disposable: "",
  };
}

const FACTORS = {
  electricity: 0.5827,
  gas: 2.15,
  water: 0.3,

  walk: 0,
  bike: 0,
  subway: 0.035,
  bus: 0.045,
  car: 0.18,
  taxi: 0.2,
  train: 0.04,
  flight: 0.285,

  meat: 1.5,
  dairy: 0.8,
  vegetables: 0.25,
  fruit: 0.3,
  takeaway: 0.35,

  express: 0.25,
  disposable: 0.08,
};

const FIELD_META = {
  electricity: {
    label: "用电量",
    unit: "kWh",
    category: "home",
    placeholder: "如 120",
    hint: "可参考电费账单或按月估算。",
  },
  gas: {
    label: "燃气用量",
    unit: "m³",
    category: "home",
    placeholder: "如 20",
    hint: "如无燃气使用，可填 0。",
  },
  water: {
    label: "用水量",
    unit: "吨",
    category: "home",
    placeholder: "如 6",
    hint: "可参考水费账单或按月估算。",
  },

  walk: {
    label: "步行距离",
    unit: "km",
    category: "transport",
    placeholder: "如 30",
    hint: "步行不直接计入碳排放，但可体现低碳行为。",
  },
  bike: {
    label: "骑行距离",
    unit: "km",
    category: "transport",
    placeholder: "如 20",
    hint: "骑行不直接计入碳排放。",
  },
  subway: {
    label: "地铁距离",
    unit: "km",
    category: "transport",
    placeholder: "如 80",
    hint: "填写本月乘坐地铁的大致总距离。",
  },
  bus: {
    label: "公交距离",
    unit: "km",
    category: "transport",
    placeholder: "如 60",
    hint: "填写本月乘坐公交的大致总距离。",
  },
  car: {
    label: "私家车距离",
    unit: "km",
    category: "transport",
    placeholder: "如 150",
    hint: "填写个人出行对应的私家车距离。",
  },
  taxi: {
    label: "网约车/出租车距离",
    unit: "km",
    category: "transport",
    placeholder: "如 50",
    hint: "填写本月打车或网约车的大致距离。",
  },
  train: {
    label: "高铁/火车距离",
    unit: "km",
    category: "transport",
    placeholder: "如 300",
    hint: "填写本月高铁或火车出行距离。",
  },
  flight: {
    label: "飞机距离",
    unit: "km",
    category: "transport",
    placeholder: "如 0",
    hint: "如无飞行出行，可填 0。",
  },

  meat: {
    label: "肉类餐食",
    unit: "次",
    category: "food",
    placeholder: "如 40",
    hint: "可按一餐中明显包含肉类来估算。",
  },
  dairy: {
    label: "奶制品",
    unit: "次",
    category: "food",
    placeholder: "如 20",
    hint: "包括牛奶、酸奶、奶茶、奶酪等。",
  },
  vegetables: {
    label: "蔬菜类餐食",
    unit: "次",
    category: "food",
    placeholder: "如 60",
    hint: "以蔬菜、豆制品等为主的餐食次数。",
  },
  fruit: {
    label: "水果食用",
    unit: "次",
    category: "food",
    placeholder: "如 25",
    hint: "按食用水果的次数估算。",
  },
  takeaway: {
    label: "外卖次数",
    unit: "次",
    category: "food",
    placeholder: "如 12",
    hint: "外卖涉及餐食、包装和配送。",
  },

  express: {
    label: "快递数量",
    unit: "件",
    category: "consumption",
    placeholder: "如 8",
    hint: "包括网购包裹、快递收发等。",
  },
  disposable: {
    label: "一次性用品",
    unit: "次",
    category: "consumption",
    placeholder: "如 15",
    hint: "包括一次性餐具、杯子、塑料袋等。",
  },
};

const CATEGORY_META = {
  home: {
    title: "居家能源",
    shortTitle: "居家",
    icon: "🏠",
    color: "#2E7D32",
    desc: "用电、燃气和用水等日常资源消耗。",
  },
  transport: {
    title: "交通出行",
    shortTitle: "交通",
    icon: "🚇",
    color: "#26A69A",
    desc: "通勤、打车、私家车、铁路和航空等出行行为。",
  },
  food: {
    title: "饮食习惯",
    shortTitle: "饮食",
    icon: "🥗",
    color: "#FFB74D",
    desc: "不同饮食结构和外卖消费带来的生活排放。",
  },
  consumption: {
    title: "消费行为",
    shortTitle: "消费",
    icon: "📦",
    color: "#5C6BC0",
    desc: "快递、包装和一次性用品等消费相关排放。",
  },
};

const CATEGORY_FIELDS = {
  home: ["electricity", "gas", "water"],
  transport: ["walk", "bike", "subway", "bus", "car", "taxi", "train", "flight"],
  food: ["meat", "dairy", "vegetables", "fruit", "takeaway"],
  consumption: ["express", "disposable"],
};

const REDUCTION_RATE = {
  electricity: 0.15,
  gas: 0.1,
  water: 0.1,
  car: 0.2,
  taxi: 0.2,
  flight: 0.15,
  meat: 0.18,
  dairy: 0.12,
  takeaway: 0.25,
  express: 0.2,
  disposable: 0.25,
  subway: 0.05,
  bus: 0.05,
  train: 0.05,
  vegetables: 0.05,
  fruit: 0.05,
  walk: 0,
  bike: 0,
};

const ADVICE_MAP = {
  electricity: "优先关注空调、照明和待机电器，养成随手关灯、合理设置空调温度、减少待机耗电的习惯。",
  gas: "减少不必要的长时间炖煮，合理使用热水和燃气设备，可降低居家能源排放。",
  water: "缩短淋浴时间，重复利用生活用水，及时修理漏水设施，有助于降低资源消耗。",
  car: "私家车排放贡献较高时，可优先考虑公共交通、拼车、骑行或步行替代短距离出行。",
  taxi: "网约车和出租车可尽量与地铁、公交组合使用，减少单独乘车距离。",
  flight: "航空出行排放强度较高，短途出行可优先比较高铁或火车方案。",
  meat: "肉类餐食较多时，可适当增加蔬菜、豆制品和粗粮比例，尝试每周设置低碳饮食日。",
  dairy: "奶制品消费较多时，可适度控制高糖奶茶、含乳饮品等消费频率。",
  takeaway: "外卖次数较多时，可增加堂食或自带餐具，减少一次性包装和配送排放。",
  express: "网购和快递较多时，可合并下单、减少冲动消费，并优先选择简约包装。",
  disposable: "一次性用品使用较多时，可随身携带水杯、餐具和环保袋，减少重复消耗。",
};

function getProfile(total) {
  if (total <= 0) {
    return {
      name: "待测评",
      level: "请先填写数据",
      desc: "填写本月生活行为数据后，系统将生成碳足迹画像。",
    };
  }

  if (total < 80) {
    return {
      name: "低碳型",
      level: "绿色表现较好",
      desc: "你的月度生活碳足迹处于较低水平，说明低碳出行、节约能源或理性消费方面表现较好。",
    };
  }

  if (total < 180) {
    return {
      name: "适中型",
      level: "整体较为均衡",
      desc: "你的月度生活碳足迹处于中等水平，可以从主要排放来源入手进行针对性优化。",
    };
  }

  if (total < 300) {
    return {
      name: "改善型",
      level: "存在明显优化空间",
      desc: "你的月度生活碳足迹偏高，建议重点关注交通出行、居家能源或高碳饮食等方面。",
    };
  }

  return {
    name: "高碳改善型",
    level: "建议优先改善",
    desc: "你的月度生活碳足迹较高，建议优先识别高贡献行为，并逐步建立稳定的低碳生活习惯。",
  };
}

function calculateCarbon(form) {
  const items = {};
  const categories = {
    home: 0,
    transport: 0,
    food: 0,
    consumption: 0,
  };

  Object.keys(FIELD_META).forEach((key) => {
    const value = parseNumber(form[key]);
    const factor = FACTORS[key] || 0;
    const emission = value * factor;
    const category = FIELD_META[key].category;

    items[key] = {
      key,
      label: FIELD_META[key].label,
      unit: FIELD_META[key].unit,
      value,
      factor,
      emission,
      category,
    };

    categories[category] += emission;
  });

  const total = Object.values(categories).reduce((sum, value) => sum + value, 0);
  const annual = total * 12;

  const categoryEntries = Object.entries(categories);
  const highestCategoryEntry = categoryEntries
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])[0];

  const highestItem = Object.values(items)
    .filter((item) => item.emission > 0)
    .sort((a, b) => b.emission - a.emission)[0];

  return {
    month: form.month,
    total,
    annual,
    categories,
    items,
    highestCategory: highestCategoryEntry
      ? {
          key: highestCategoryEntry[0],
          value: highestCategoryEntry[1],
          ...CATEGORY_META[highestCategoryEntry[0]],
        }
      : null,
    highestItem: highestItem || null,
    profile: getProfile(total),
    calculatedAt: new Date().toISOString(),
  };
}

function getPersonalSuggestions(result) {
  if (!result || result.total <= 0) {
    return ["请先填写本月生活行为数据，系统将根据主要排放来源生成个性化建议。"];
  }

  const topItems = Object.values(result.items)
    .filter((item) => item.emission > 0)
    .sort((a, b) => b.emission - a.emission);

  const suggestions = [];

  topItems.forEach((item) => {
    if (ADVICE_MAP[item.key] && suggestions.length < 5) {
      suggestions.push(ADVICE_MAP[item.key]);
    }
  });

  if (suggestions.length < 3) {
    suggestions.push("保持步行、骑行、公共交通等低碳出行方式，有助于持续降低个人生活碳足迹。");
    suggestions.push("购买商品前先判断是否真正需要，减少冲动消费和重复购买。");
  }

  return suggestions.slice(0, 5);
}

function getReductionPotentials(result) {
  if (!result || result.total <= 0) return [];

  return Object.values(result.items)
    .map((item) => {
      const rate = REDUCTION_RATE[item.key] || 0;
      return {
        ...item,
        rate,
        potential: item.emission * rate,
      };
    })
    .filter((item) => item.potential > 0.1)
    .sort((a, b) => b.potential - a.potential)
    .slice(0, 4);
}

function getLastTwelveMonths() {
  const months = [];
  const now = new Date();
  now.setDate(1);

  for (let i = 11; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    months.push(`${year}-${month}`);
  }

  return months;
}

function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [activePage, setActivePage] = useState("home");
  const [form, setForm] = useState(createDefaultForm);
  const [result, setResult] = useState(null);
  const [records, setRecords] = useState(loadRecords);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => b.month.localeCompare(a.month));
  }, [records]);

  function updateForm(key, value) {
    if (key === "month") {
      setForm((prev) => ({ ...prev, month: value }));
      return;
    }

    const num = Number(value);
    if (value !== "" && (!Number.isFinite(num) || num < 0)) return;

    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleCalculate(event) {
    event.preventDefault();

    if (!form.month) {
      alert("请先选择测评月份。");
      return;
    }

    const currentMonth = getCurrentMonth();

    if (form.month > currentMonth) {
      alert("测评月份不能晚于当前月份。");
      return;
    }

    const newResult = calculateCarbon(form);
    const existingRecord = records.find((record) => record.month === form.month);

    const newRecord = {
      id: existingRecord?.id || `${form.month}-${Date.now()}`,
      month: form.month,
      form: { ...form },
      result: newResult,
      createdAt: existingRecord?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextRecords = [
      newRecord,
      ...records.filter((record) => record.month !== form.month),
    ].sort((a, b) => b.month.localeCompare(a.month));

    setRecords(nextRecords);
    setResult(newResult);

    setTimeout(() => {
      const report = document.getElementById("result-report");
      if (report) report.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function handleResetForm() {
    setForm(createDefaultForm());
    setResult(null);
  }

  function handleViewRecord(record) {
    setForm(record.form);
    setResult(record.result);
    setActivePage("calculator");

    setTimeout(() => {
      const report = document.getElementById("result-report");
      if (report) report.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function handleEditRecord(record) {
    setForm(record.form);
    setResult(null);
    setActivePage("calculator");

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 80);
  }

  function handleDeleteRecord(id) {
    const ok = window.confirm("确定要删除这条记录吗？");
    if (!ok) return;
    setRecords((prev) => prev.filter((record) => record.id !== id));
  }

  function handleClearRecords() {
    const ok = window.confirm("确定要清空全部历史记录吗？此操作不可恢复。");
    if (!ok) return;
    setRecords([]);
    setResult(null);
  }

  return (
    <div className="app">
      <header className="topbar no-print">
        <button className="brand" onClick={() => setActivePage("home")}>
          <span className="brand-icon">🌿</span>
          <span>
            <strong>个人绿色生活</strong>
            <small>碳足迹指南系统</small>
          </span>
        </button>

        <nav className="nav">
          <button
            className={activePage === "home" ? "nav-btn active" : "nav-btn"}
            onClick={() => setActivePage("home")}
          >
            首页
          </button>
          <button
            className={activePage === "calculator" ? "nav-btn active" : "nav-btn"}
            onClick={() => setActivePage("calculator")}
          >
            碳足迹测评
          </button>
          <button
            className={activePage === "records" ? "nav-btn active" : "nav-btn"}
            onClick={() => setActivePage("records")}
          >
            我的记录
          </button>
          <button
            className={activePage === "knowledge" ? "nav-btn active" : "nav-btn"}
            onClick={() => setActivePage("knowledge")}
          >
            低碳科普
          </button>
        </nav>
      </header>

      <main>
        {activePage === "home" && <HomePage setActivePage={setActivePage} />}
        {activePage === "calculator" && (
          <CalculatorPage
            form={form}
            result={result}
            updateForm={updateForm}
            handleCalculate={handleCalculate}
            handleResetForm={handleResetForm}
          />
        )}
        {activePage === "records" && (
          <RecordsPage
            records={sortedRecords}
            handleViewRecord={handleViewRecord}
            handleEditRecord={handleEditRecord}
            handleDeleteRecord={handleDeleteRecord}
            handleClearRecords={handleClearRecords}
          />
        )}
        {activePage === "knowledge" && <KnowledgePage />}
      </main>

      <footer className="footer no-print">
        <p>
          本系统用于绿色低碳生活科普、个人行为反思与实践展示，测算结果为估算值，仅供参考。
        </p>
      </footer>
    </div>
  );
}

function HomePage({ setActivePage }) {
  return (
    <div className="page">
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">Green Life & Carbon Footprint</p>
          <h1>个人绿色生活与碳足迹指南系统</h1>
          <p className="hero-desc">
            测算个人生活碳足迹，识别主要排放来源，生成个性化绿色低碳建议，
            帮助用户从日常行为中理解绿色生活方式。
          </p>

          <div className="hero-actions">
            <button className="primary-btn" onClick={() => setActivePage("calculator")}>
              开始测评
            </button>
            <button className="secondary-btn" onClick={() => setActivePage("knowledge")}>
              查看低碳科普
            </button>
          </div>
        </div>

        <div className="hero-card">
          <div className="hero-card-ring">
            <span>CO₂</span>
          </div>
          <h3>月度生活碳足迹估算</h3>
          <p>
            围绕居家能源、交通出行、饮食习惯和消费行为四类场景进行估算。
          </p>
        </div>
      </section>

      <section className="grid four">
        <FeatureCard
          icon="🧮"
          title="个人碳足迹测算"
          text="输入月度生活行为数据，快速估算个人生活碳排放情况。"
        />
        <FeatureCard
          icon="📊"
          title="结构化结果解释"
          text="通过环形图、分类占比和分项详情识别主要排放来源。"
        />
        <FeatureCard
          icon="💡"
          title="个性化减碳建议"
          text="根据高贡献行为生成针对性绿色生活建议。"
        />
        <FeatureCard
          icon="📅"
          title="月度趋势记录"
          text="保存不同月份测评结果，观察个人低碳行为变化。"
        />
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Before You Use</p>
          <h2>使用前请了解</h2>
          <p>
            为了让测评结果更容易理解，系统提供了使用说明、计算说明和隐私说明。
          </p>
        </div>

        <div className="grid three">
          <InfoPanel
            title="使用说明"
            items={[
              "本系统以月度生活行为为基础进行碳足迹估算。",
              "用户可填写当前月份及以前月份的数据。",
              "同一个月份重复测评时，系统会自动覆盖该月旧记录。",
              "测评结果可用于个人绿色生活反思和科普展示。",
            ]}
          />
          <InfoPanel
            title="计算说明"
            items={[
              "系统将不同生活行为乘以对应排放因子，得到估算碳排放量。",
              "结果按居家能源、交通出行、饮食习惯和消费行为四类汇总。",
              "当前排放因子主要用于科普估算，后续可根据权威数据继续修正。",
              "年度碳足迹为月度结果乘以 12 的估算值。",
            ]}
          />
          <InfoPanel
            title="隐私说明"
            items={[
              "当前系统不上传个人数据，也没有后台数据库。",
              "历史记录仅保存在当前浏览器本地。",
              "更换设备、浏览器或清除缓存后，历史记录可能无法保留。",
              "如需团队收集数据，后续可接入问卷或数据库系统。",
            ]}
          />
        </div>
      </section>

      <section className="cta-section">
        <div>
          <h2>从一次测评开始，发现自己的低碳改善空间</h2>
          <p>
            绿色生活不是一次性行动，而是从高频生活习惯中逐步形成的长期改变。
          </p>
        </div>
        <button className="primary-btn" onClick={() => setActivePage("calculator")}>
          立即开始
        </button>
      </section>
    </div>
  );
}

function CalculatorPage({
  form,
  result,
  updateForm,
  handleCalculate,
  handleResetForm,
}) {
  return (
    <div className="page">
      <section className="section compact">
        <div className="section-heading left">
          <p className="eyebrow">Carbon Calculator</p>
          <h1>个人月度碳足迹测评</h1>
          <p>
            请根据本月生活情况填写数据。无法精确统计时，可以根据账单、出行软件记录或个人习惯进行合理估算。
          </p>
        </div>

        <div className="notice-card">
          <strong>填写提示：</strong>
          <span>
            输入框可留空，系统会按 0 处理。测算结果为科普估算值，主要用于识别个人生活中的相对高排放来源。
          </span>
        </div>

        <form className="form" onSubmit={handleCalculate}>
          <div className="month-card">
            <div>
              <label htmlFor="month">测评月份</label>
              <p>请选择当前月份或以前月份。同一月份再次测评会覆盖旧记录。</p>
            </div>
            <input
              id="month"
              type="month"
              value={form.month}
              min={getMinMonth()}
              max={getCurrentMonth()}
              onChange={(e) => updateForm("month", e.target.value)}
            />
          </div>

          <FormSection
            number="01"
            title="居家能源与资源使用"
            desc="填写用电、燃气和用水情况，用于估算家庭或个人居住场景中的资源消耗。"
            fields={CATEGORY_FIELDS.home}
            form={form}
            updateForm={updateForm}
          />

          <FormSection
            number="02"
            title="交通出行"
            desc="填写本月不同交通方式的大致出行距离，系统会区分低碳出行和高排放出行方式。"
            fields={CATEGORY_FIELDS.transport}
            form={form}
            updateForm={updateForm}
          />

          <FormSection
            number="03"
            title="饮食习惯"
            desc="填写本月主要饮食行为。不同饮食结构和外卖频率会影响生活碳足迹。"
            fields={CATEGORY_FIELDS.food}
            form={form}
            updateForm={updateForm}
          />

          <FormSection
            number="04"
            title="消费行为"
            desc="填写快递和一次性用品使用情况，用于反映日常消费和包装相关排放。"
            fields={CATEGORY_FIELDS.consumption}
            form={form}
            updateForm={updateForm}
          />

          <div className="form-actions no-print">
            <button type="submit" className="primary-btn">
              生成碳足迹报告
            </button>
            <button type="button" className="secondary-btn" onClick={handleResetForm}>
              清空表单
            </button>
          </div>
        </form>
      </section>

      {result && <ResultReport result={result} />}
    </div>
  );
}

function FormSection({ number, title, desc, fields, form, updateForm }) {
  return (
    <section className="form-section">
      <div className="form-section-head">
        <span>{number}</span>
        <div>
          <h2>{title}</h2>
          <p>{desc}</p>
        </div>
      </div>

      <div className="input-grid">
        {fields.map((key) => (
          <InputField
            key={key}
            fieldKey={key}
            value={form[key]}
            onChange={(value) => updateForm(key, value)}
          />
        ))}
      </div>
    </section>
  );
}

function InputField({ fieldKey, value, onChange }) {
  const meta = FIELD_META[fieldKey];

  return (
    <label className="input-card">
      <span className="input-label">
        {meta.label}
        <em>{meta.unit}</em>
      </span>
      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        placeholder={meta.placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <small>{meta.hint}</small>
    </label>
  );
}

function ResultReport({ result }) {
  const suggestions = getPersonalSuggestions(result);
  const potentials = getReductionPotentials(result);
  const total = result.total;
  const highestCategory = result.highestCategory;
  const highestItem = result.highestItem;

  return (
    <section className="section result-section" id="result-report">
      <div className="section-heading left">
        <p className="eyebrow">Carbon Report</p>
        <h1>{formatMonth(result.month)}碳足迹报告</h1>
        <p>
          本报告从生活行为数据出发，展示月度碳足迹总量、结构分布、主要来源和减碳建议。
        </p>
      </div>

      <div className="report-summary">
        <div>
          <h2>报告摘要</h2>
          {total > 0 ? (
            <p>
              你在 {formatMonth(result.month)} 的生活碳足迹约为
              <strong> {formatNumber(total, 2)} kgCO₂</strong>。
              其中，
              {highestCategory ? (
                <>
                  <strong>{highestCategory.title}</strong> 是主要排放类别，占比约
                  <strong> {formatPercent(highestCategory.value, total)}%</strong>；
                </>
              ) : null}
              {highestItem ? (
                <>
                  分项中 <strong>{highestItem.label}</strong> 贡献最高，约为
                  <strong> {formatNumber(highestItem.emission, 2)} kgCO₂</strong>。
                </>
              ) : null}
            </p>
          ) : (
            <p>
              当前月份未填写有效生活行为数据，因此暂无法形成主要排放来源分析。
            </p>
          )}
        </div>

        <button className="secondary-btn no-print" onClick={() => window.print()}>
          打印 / 保存 PDF 报告
        </button>
      </div>

      <div className="result-overview">
        <MetricCard
          label="月度生活碳足迹"
          value={`${formatNumber(result.total, 2)} kgCO₂`}
          desc="根据本月生活行为估算"
        />
        <MetricCard
          label="预计年度生活碳足迹"
          value={`${formatNumber(result.annual, 2)} kgCO₂`}
          desc="按当前月份水平乘以 12 估算"
        />
        <MetricCard
          label="碳足迹画像"
          value={result.profile.name}
          desc={result.profile.level}
        />
      </div>

      <div className="profile-card">
        <div>
          <span className="profile-badge">{result.profile.name}</span>
          <h2>{result.profile.level}</h2>
          <p>{result.profile.desc}</p>
        </div>
      </div>

      <div className="report-grid">
        <div className="chart-card">
          <h2>分类碳足迹结构</h2>
          <CategoryPieChart categories={result.categories} total={result.total} />

          <div className="category-bars">
            {Object.entries(result.categories).map(([key, value]) => (
              <CategoryBar
                key={key}
                categoryKey={key}
                value={value}
                total={result.total}
              />
            ))}
          </div>
        </div>

        <div className="chart-card">
          <h2>优先改善顺序</h2>
          {potentials.length > 0 ? (
            <ol className="priority-list">
              {potentials.map((item) => (
                <li key={item.key}>
                  <div>
                    <strong>{item.label}</strong>
                    <span>
                      当前约 {formatNumber(item.emission, 2)} kgCO₂，
                      若改善 {Math.round(item.rate * 100)}%，预计可减少{" "}
                      {formatNumber(item.potential, 2)} kgCO₂。
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="empty-text">暂无明显高排放分项，建议继续保持低碳生活习惯。</p>
          )}
        </div>
      </div>

      <div className="category-card-grid">
        {Object.entries(result.categories).map(([key, value]) => (
          <div className="category-card" key={key}>
            <div className="category-icon" style={{ background: CATEGORY_META[key].color }}>
              {CATEGORY_META[key].icon}
            </div>
            <h3>{CATEGORY_META[key].title}</h3>
            <strong>{formatNumber(value, 2)} kgCO₂</strong>
            <p>
              占总量 {formatPercent(value, result.total)}%。{CATEGORY_META[key].desc}
            </p>
          </div>
        ))}
      </div>

      <DetailBreakdown result={result} />

      <div className="advice-section">
        <div className="section-heading left">
          <p className="eyebrow">Suggestions</p>
          <h2>个性化绿色生活建议</h2>
          <p>系统根据你的主要排放来源生成以下建议，可优先从前几项开始调整。</p>
        </div>

        <div className="advice-list">
          {suggestions.map((item, index) => (
            <div className="advice-item" key={item}>
              <span>{index + 1}</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="knowledge-highlight">
        <h2>绿色低碳行动拓展建议</h2>
        <div className="grid four">
          <ActionMiniCard title="节约能源" text="合理使用空调、照明和电器，减少待机耗电。" />
          <ActionMiniCard title="低碳出行" text="短途优先步行骑行，中长途优先公共交通。" />
          <ActionMiniCard title="理性消费" text="减少冲动网购，合并快递，优先选择耐用品。" />
          <ActionMiniCard title="减少浪费" text="减少食物浪费和一次性用品使用，重复利用资源。" />
        </div>
      </div>
    </section>
  );
}

function CategoryPieChart({ categories, total }) {
  const keys = Object.keys(CATEGORY_META);
  let current = 0;

  const gradient =
    total > 0
      ? keys
          .map((key) => {
            const value = categories[key] || 0;
            const start = current;
            const end = current + (value / total) * 100;
            current = end;
            return `${CATEGORY_META[key].color} ${start}% ${end}%`;
          })
          .join(", ")
      : "#e5e7eb 0% 100%";

  return (
    <div className="pie-wrap">
      <div className="pie" style={{ background: `conic-gradient(${gradient})` }}>
        <div className="pie-center">
          <strong>{formatNumber(total, 1)}</strong>
          <span>kgCO₂</span>
        </div>
      </div>

      <div className="pie-legend">
        {keys.map((key) => (
          <div key={key}>
            <span style={{ background: CATEGORY_META[key].color }} />
            {CATEGORY_META[key].title}
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryBar({ categoryKey, value, total }) {
  const percent = total > 0 ? (value / total) * 100 : 0;
  const meta = CATEGORY_META[categoryKey];

  return (
    <div className="category-bar">
      <div className="bar-head">
        <span>{meta.title}</span>
        <strong>{formatPercent(value, total)}%</strong>
      </div>
      <div className="bar-track">
        <div
          className="bar-fill"
          style={{
            width: `${percent}%`,
            background: meta.color,
          }}
        />
      </div>
    </div>
  );
}

function DetailBreakdown({ result }) {
  return (
    <div className="detail-card">
      <div className="section-heading left">
        <p className="eyebrow">Details</p>
        <h2>分项碳足迹详情</h2>
        <p>以下结果展示每个生活行为分项的估算排放量及其占总量的比例。</p>
      </div>

      {Object.entries(CATEGORY_FIELDS).map(([categoryKey, fields]) => {
        const categoryTotal = result.categories[categoryKey] || 0;
        const meta = CATEGORY_META[categoryKey];

        return (
          <div className="detail-group" key={categoryKey}>
            <div className="detail-group-title">
              <h3>
                {meta.icon} {meta.title}
              </h3>
              <span>
                合计 {formatNumber(categoryTotal, 2)} kgCO₂，
                占比 {formatPercent(categoryTotal, result.total)}%
              </span>
            </div>

            <div className="detail-table">
              {fields.map((key) => {
                const item = result.items[key];

                return (
                  <div className="detail-row" key={key}>
                    <span>{item.label}</span>
                    <span>
                      {formatNumber(item.value, 2)} {item.unit}
                    </span>
                    <span>{formatNumber(item.emission, 2)} kgCO₂</span>
                    <strong>{formatPercent(item.emission, result.total)}%</strong>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RecordsPage({
  records,
  handleViewRecord,
  handleEditRecord,
  handleDeleteRecord,
  handleClearRecords,
}) {
  const currentYear = String(new Date().getFullYear());
  const currentYearRecords = records.filter((record) => record.month.startsWith(currentYear));

  const yearTotal = currentYearRecords.reduce(
    (sum, record) => sum + record.result.total,
    0
  );

  const yearAverage =
    currentYearRecords.length > 0 ? yearTotal / currentYearRecords.length : 0;

  const highestRecord = currentYearRecords.length
    ? [...currentYearRecords].sort((a, b) => b.result.total - a.result.total)[0]
    : null;

  const lowestRecord = currentYearRecords.length
    ? [...currentYearRecords].sort((a, b) => a.result.total - b.result.total)[0]
    : null;

  return (
    <div className="page">
      <section className="section compact">
        <div className="section-heading left">
          <p className="eyebrow">My Records</p>
          <h1>我的月度碳足迹记录</h1>
          <p>
            历史记录保存在当前浏览器本地，可用于观察个人绿色生活行为的月度变化。
          </p>
        </div>

        <div className="notice-card">
          <strong>隐私提示：</strong>
          <span>
            当前系统没有后台数据库，你的历史记录不会自动上传。更换设备或清除浏览器缓存后，本地记录可能丢失。
          </span>
        </div>

        <div className="record-stats">
          <MetricCard
            label={`${currentYear}年已记录月份`}
            value={`${currentYearRecords.length} 个`}
            desc="当前浏览器中保存的记录数量"
          />
          <MetricCard
            label="年度累计碳足迹"
            value={`${formatNumber(yearTotal, 2)} kgCO₂`}
            desc="已记录月份结果合计"
          />
          <MetricCard
            label="月均碳足迹"
            value={`${formatNumber(yearAverage, 2)} kgCO₂`}
            desc="按已记录月份计算"
          />
          <MetricCard
            label="最高 / 最低月份"
            value={
              highestRecord && lowestRecord
                ? `${formatMonth(highestRecord.month)} / ${formatMonth(lowestRecord.month)}`
                : "暂无"
            }
            desc="用于识别波动较大的月份"
          />
        </div>

        <MonthlyTrendChart records={records} />

        <div className="records-head">
          <h2>历史记录</h2>
          {records.length > 0 && (
            <button className="danger-btn" onClick={handleClearRecords}>
              清空全部
            </button>
          )}
        </div>

        {records.length === 0 ? (
          <div className="empty-card">
            <h3>暂无历史记录</h3>
            <p>完成一次碳足迹测评后，系统会自动保存该月份记录。</p>
          </div>
        ) : (
          <div className="records-list">
            {records.map((record) => (
              <div className="record-card" key={record.id}>
                <div>
                  <h3>{formatMonth(record.month)}</h3>
                  <p>
                    月度碳足迹：<strong>{formatNumber(record.result.total, 2)} kgCO₂</strong>
                  </p>
                  <small>
                    主要来源：
                    {record.result.highestCategory
                      ? record.result.highestCategory.title
                      : "暂无"}
                  </small>
                </div>

                <div className="record-actions">
                  <button onClick={() => handleViewRecord(record)}>查看详情</button>
                  <button onClick={() => handleEditRecord(record)}>修改记录</button>
                  <button className="danger-text" onClick={() => handleDeleteRecord(record.id)}>
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MonthlyTrendChart({ records }) {
  const months = getLastTwelveMonths();
  const map = new Map(records.map((record) => [record.month, record.result.total]));
  const values = months.map((month) => map.get(month) || 0);
  const max = Math.max(...values, 1);

  return (
    <div className="trend-card">
      <div className="section-heading left small">
        <h2>最近 12 个月趋势</h2>
        <p>空心点表示该月份暂无记录。趋势图用于观察个人碳足迹变化方向。</p>
      </div>

      <div className="trend-chart">
        {months.map((month) => {
          const value = map.get(month);
          const height = value ? Math.max((value / max) * 100, 8) : 0;

          return (
            <div className="trend-item" key={month}>
              <div className="trend-bar-wrap">
                {value ? (
                  <div className="trend-bar" style={{ height: `${height}%` }} />
                ) : (
                  <div className="trend-empty-dot" />
                )}
              </div>
              <span>{month.replace("-", "/")}</span>
              <small>{value ? formatNumber(value, 0) : "—"}</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KnowledgePage() {
  return (
    <div className="page">
      <section className="section compact">
        <div className="section-heading left">
          <p className="eyebrow">Knowledge</p>
          <h1>绿色低碳生活科普</h1>
          <p>
            低碳生活不是牺牲生活质量，而是在能源、出行、饮食和消费中做出更理性的选择。
          </p>
        </div>

        <KnowledgeSection
          number="一"
          title="基础认知：理解个人碳足迹"
          cards={[
            {
              title: "什么是个人碳足迹？",
              text: "个人碳足迹是指一个人在日常生活中因用电、出行、饮食、消费等活动直接或间接产生的温室气体排放量。",
            },
            {
              title: "为什么要做月度测评？",
              text: "月度测评可以帮助用户把抽象的低碳理念转化为具体生活行为，从而识别哪些习惯最值得优先改善。",
            },
            {
              title: "结果为什么是估算值？",
              text: "生活碳足迹会受到地区能源结构、产品来源、交通工具效率等因素影响，因此本系统结果主要用于科普和行为比较。",
            },
          ]}
        />

        <KnowledgeSection
          number="二"
          title="生活场景：从高频行为开始改善"
          cards={[
            {
              title: "居家能源",
              text: "空调、照明、热水和电器待机都会形成能源消耗。合理设置温度、减少待机和提高用能效率，是居家减碳的重要方式。",
            },
            {
              title: "交通出行",
              text: "步行、骑行、公交和地铁通常比私家车、网约车和飞机更加低碳。短距离出行尤其适合优先选择慢行交通。",
            },
            {
              title: "饮食结构",
              text: "适度减少高碳饮食、增加蔬菜豆制品比例、减少食物浪费，有助于降低饮食相关碳足迹。",
            },
          ]}
        />

        <KnowledgeSection
          number="三"
          title="资源循环：减少浪费比单次节省更重要"
          cards={[
            {
              title: "减少一次性用品",
              text: "一次性餐具、杯子和塑料袋虽然单次排放不高，但高频使用会形成持续资源消耗。",
            },
            {
              title: "理性消费",
              text: "合并下单、减少冲动购买、延长物品使用寿命，可以减少生产、包装和运输过程中的间接排放。",
            },
            {
              title: "快递包装",
              text: "网购包裹通常涉及纸箱、塑料填充物和运输配送。选择简约包装和集中购买有助于减少资源浪费。",
            },
          ]}
        />

        <KnowledgeSection
          number="四"
          title="城市生态：从个人习惯走向公共参与"
          cards={[
            {
              title: "关注城市水岸生态",
              text: "河湖、水岸、公园和湿地是城市生态系统的重要组成部分，参与垃圾清理、环保宣传和生态观察也是绿色生活的一部分。",
            },
            {
              title: "参与社区行动",
              text: "垃圾分类、节能宣传、旧物循环和绿色出行倡议，可以把个人低碳行为扩展为社区层面的共同实践。",
            },
            {
              title: "形成长期习惯",
              text: "低碳生活不是一次性任务，而是通过持续记录、比较和调整，逐步形成稳定的生活方式。",
            },
          ]}
        />

        <section className="action-checklist">
          <div className="section-heading left">
            <p className="eyebrow">Checklist</p>
            <h2>8 件可以马上开始的小事</h2>
          </div>

          <div className="checklist-grid">
            {[
              "随手关灯，减少电器待机",
              "空调温度夏季不设过低",
              "短途优先步行或骑行",
              "通勤优先选择公共交通",
              "减少一次性餐具和塑料袋",
              "外卖备注少用或不用餐具",
              "减少冲动网购，合并快递",
              "适度增加低碳饮食比例",
            ].map((item) => (
              <div className="check-item" key={item}>
                <span>✓</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, text }) {
  return (
    <div className="feature-card">
      <span>{icon}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function InfoPanel({ title, items }) {
  return (
    <div className="info-panel">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function MetricCard({ label, value, desc }) {
  return (
    <div className="metric-card">
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{desc}</span>
    </div>
  );
}

function ActionMiniCard({ title, text }) {
  return (
    <div className="action-mini-card">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function KnowledgeSection({ number, title, cards }) {
  return (
    <section className="knowledge-section">
      <div className="knowledge-title">
        <span>{number}</span>
        <h2>{title}</h2>
      </div>

      <div className="grid three">
        {cards.map((card) => (
          <div className="knowledge-card" key={card.title}>
            <h3>{card.title}</h3>
            <p>{card.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}