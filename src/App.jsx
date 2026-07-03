import { useEffect, useState } from 'react'

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
}

const LABELS = {
  electricity: '用电',
  gas: '燃气',
  water: '用水',

  walk: '步行',
  bike: '骑行',
  subway: '地铁',
  bus: '公交',
  car: '私家车',
  taxi: '网约车/出租车',
  train: '高铁/火车',
  flight: '飞机',

  meat: '肉类餐食',
  dairy: '奶制品',
  vegetables: '蔬菜类餐食',
  fruit: '水果',
  takeaway: '外卖',

  express: '快递',
  disposable: '一次性用品',
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7)
}

function getMonthOffset(baseMonth, offset) {
  const [year, month] = baseMonth.split('-').map(Number)
  const date = new Date(year, month - 1 + offset, 1)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function getMonthRange(endMonth, count) {
  const months = []
  for (let i = count - 1; i >= 0; i--) {
    months.push(getMonthOffset(endMonth, -i))
  }
  return months
}

function getDetailLabel(key) {
  return LABELS[key] || key
}

function formatPercent(value, total) {
  if (!total || Number(total) === 0) return '0.0'
  return ((Number(value || 0) / Number(total)) * 100).toFixed(1)
}

const minAllowedMonth = getMonthOffset(getCurrentMonth(), -59)
const maxAllowedMonth = getCurrentMonth()

const initialForm = {
  month: getCurrentMonth(),

  electricity: '',
  gas: '',
  water: '',

  walk: '',
  bike: '',
  subway: '',
  bus: '',
  car: '',
  taxi: '',
  train: '',
  flight: '',

  meat: '',
  dairy: '',
  vegetables: '',
  fruit: '',
  takeaway: '',

  express: '',
  disposable: '',
}

const sampleForm = {
  month: getCurrentMonth(),

  electricity: '100',
  gas: '8',
  water: '5',

  walk: '20',
  bike: '15',
  subway: '60',
  bus: '30',
  car: '20',
  taxi: '10',
  train: '80',
  flight: '0',

  meat: '25',
  dairy: '10',
  vegetables: '30',
  fruit: '20',
  takeaway: '12',

  express: '8',
  disposable: '15',
}

function App() {
  const [page, setPage] = useState('home')
  const [result, setResult] = useState(null)
  const [records, setRecords] = useState([])
  const [form, setForm] = useState(initialForm)

  useEffect(() => {
    const savedRecords = JSON.parse(localStorage.getItem('greenLifeRecords') || '[]')
    const validRecords = savedRecords.filter(
      (record) => record.month && record.result && record.month <= getCurrentMonth()
    )
    setRecords(validRecords)
  }, [])

  function handleChange(e) {
    const { name, value } = e.target

    if (name !== 'month' && Number(value) < 0) return

    setForm({
      ...form,
      [name]: value,
    })
  }

  function keepTwo(num) {
    return Math.round(num * 100) / 100
  }

  function sumObject(obj) {
    return Object.values(obj).reduce((sum, value) => sum + Number(value || 0), 0)
  }

  function hasAnyInput() {
    return Object.entries(form).some(([key, value]) => {
      if (key === 'month') return false
      return Number(value) > 0
    })
  }

  function validateMonth() {
    if (!form.month) {
      alert('请选择测评月份。')
      return false
    }

    if (form.month > maxAllowedMonth) {
      alert('测评月份不能超过当前月份。')
      return false
    }

    if (form.month < minAllowedMonth) {
      alert('测评月份建议填写最近 5 年以内的数据，避免记录过早导致趋势分析失真。')
      return false
    }

    return true
  }

  function calculateCarbon() {
    if (!validateMonth()) return

    if (!hasAnyInput()) {
      alert('请至少填写一项生活数据后再生成碳足迹结果。')
      return
    }

    const detail = {
      home: {
        electricity: keepTwo(Number(form.electricity || 0) * FACTORS.electricity),
        gas: keepTwo(Number(form.gas || 0) * FACTORS.gas),
        water: keepTwo(Number(form.water || 0) * FACTORS.water),
      },

      transport: {
        walk: keepTwo(Number(form.walk || 0) * FACTORS.walk),
        bike: keepTwo(Number(form.bike || 0) * FACTORS.bike),
        subway: keepTwo(Number(form.subway || 0) * FACTORS.subway),
        bus: keepTwo(Number(form.bus || 0) * FACTORS.bus),
        car: keepTwo(Number(form.car || 0) * FACTORS.car),
        taxi: keepTwo(Number(form.taxi || 0) * FACTORS.taxi),
        train: keepTwo(Number(form.train || 0) * FACTORS.train),
        flight: keepTwo(Number(form.flight || 0) * FACTORS.flight),
      },

      food: {
        meat: keepTwo(Number(form.meat || 0) * FACTORS.meat),
        dairy: keepTwo(Number(form.dairy || 0) * FACTORS.dairy),
        vegetables: keepTwo(Number(form.vegetables || 0) * FACTORS.vegetables),
        fruit: keepTwo(Number(form.fruit || 0) * FACTORS.fruit),
        takeaway: keepTwo(Number(form.takeaway || 0) * FACTORS.takeaway),
      },

      consumption: {
        express: keepTwo(Number(form.express || 0) * FACTORS.express),
        disposable: keepTwo(Number(form.disposable || 0) * FACTORS.disposable),
      },
    }

    const home = sumObject(detail.home)
    const transport = sumObject(detail.transport)
    const food = sumObject(detail.food)
    const consumption = sumObject(detail.consumption)

    const total = home + transport + food + consumption
    const annualTotal = total * 12

    const newResult = {
      month: form.month,
      home: keepTwo(home),
      transport: keepTwo(transport),
      food: keepTwo(food),
      consumption: keepTwo(consumption),
      total: keepTwo(total),
      annualTotal: keepTwo(annualTotal),
      detail,
    }

    const newRecord = {
      id: Date.now(),
      month: form.month,
      date: new Date().toLocaleString(),
      form,
      result: newResult,
    }

    const recordsWithoutSameMonth = records.filter((record) => record.month !== form.month)

    const newRecords = [newRecord, ...recordsWithoutSameMonth].sort((a, b) =>
      b.month.localeCompare(a.month)
    )

    setRecords(newRecords)
    localStorage.setItem('greenLifeRecords', JSON.stringify(newRecords))

    setResult(newResult)
    setPage('result')
  }

  function fillSampleData() {
    setForm({
      ...sampleForm,
      month: getCurrentMonth(),
    })
  }

  function resetForm() {
    setForm({
      ...initialForm,
      month: getCurrentMonth(),
    })
  }

  function clearRecords() {
    const confirmed = window.confirm('确定要清空所有历史记录吗？')

    if (!confirmed) return

    setRecords([])
    localStorage.removeItem('greenLifeRecords')
  }

  function deleteRecord(recordId) {
    const confirmed = window.confirm('确定要删除这条记录吗？')

    if (!confirmed) return

    const newRecords = records.filter((record) => record.id !== recordId)
    setRecords(newRecords)
    localStorage.setItem('greenLifeRecords', JSON.stringify(newRecords))
  }

  function editRecord(record) {
    setForm({
      ...initialForm,
      ...(record.form || {}),
      month: record.month || getCurrentMonth(),
    })

    setPage('calculator')
  }

  function printReport() {
    window.print()
  }

  function getCarbonLevel(total) {
    if (total <= 100) {
      return {
        level: '低碳型',
        text: '你的月度生活碳足迹水平较低，说明你已经具备较好的绿色生活习惯。',
        color: '#16a34a',
      }
    }

    if (total <= 200) {
      return {
        level: '适中型',
        text: '你的月度生活碳足迹处于中等水平，仍可以从出行、用电、饮食和消费中寻找优化空间。',
        color: '#65a30d',
      }
    }

    if (total <= 350) {
      return {
        level: '改善型',
        text: '你的月度生活碳足迹偏高，建议重点关注主要排放来源，逐步改善生活方式。',
        color: '#ca8a04',
      }
    }

    return {
      level: '高碳改善型',
      text: '你的月度生活碳足迹较高，建议从交通出行、居家能源、饮食消费和日常消费等方面系统优化。',
      color: '#dc2626',
    }
  }

  function getMainSource(currentResult) {
    const sources = [
      { name: '居家能源', value: currentResult.home },
      { name: '交通出行', value: currentResult.transport },
      { name: '饮食习惯', value: currentResult.food },
      { name: '消费行为', value: currentResult.consumption },
    ]

    sources.sort((a, b) => b.value - a.value)

    return sources[0]
  }

  function toDetailArray(obj, category) {
    return Object.entries(obj).map(([key, value]) => ({
      key,
      category,
      label: getDetailLabel(key),
      value: Number(value || 0),
    }))
  }

  function getAllDetailItems(currentResult) {
    if (!currentResult?.detail) return []

    return [
      ...toDetailArray(currentResult.detail.home, '居家能源'),
      ...toDetailArray(currentResult.detail.transport, '交通出行'),
      ...toDetailArray(currentResult.detail.food, '饮食习惯'),
      ...toDetailArray(currentResult.detail.consumption, '消费行为'),
    ]
  }

  function getMainDetailSource(currentResult) {
    const items = getAllDetailItems(currentResult).filter((item) => item.value > 0)

    if (items.length === 0) return null

    items.sort((a, b) => b.value - a.value)

    return items[0]
  }

  function getResultExplanation(currentResult) {
    const main = getMainSource(currentResult)
    const detailMain = getMainDetailSource(currentResult)
    const level = getCarbonLevel(currentResult.total)

    return {
      title: '你的结果说明',
      text: `你在 ${currentResult.month || '本月'} 的估算生活碳足迹为 ${currentResult.total} kgCO₂，预计年度生活碳足迹约为 ${currentResult.annualTotal} kgCO₂。整体上属于“${level.level}”。其中，主要排放来源为${main.name}，贡献约 ${main.value} kgCO₂。进一步看，分项中贡献较高的是${detailMain ? detailMain.label : '相关生活行为'}，建议优先从这一生活场景开始改善。`,
    }
  }

  function getSuggestions(currentResult = result) {
    if (!currentResult) return []

    const suggestions = []

    if (currentResult.home > 70) {
      suggestions.push({
        title: '优化居家能源使用',
        text: '你的居家能源碳足迹较高，建议减少电器待机时间，合理使用空调，节约燃气和用水，养成随手关灯、及时断电的习惯。',
      })
    }

    if (currentResult.transport > 60) {
      suggestions.push({
        title: '改善出行方式',
        text: '你的交通出行碳足迹较高，建议优先选择步行、骑行、地铁、公交或高铁，减少短距离私家车、网约车和不必要的飞机出行。',
      })
    }

    if (currentResult.food > 80) {
      suggestions.push({
        title: '调整饮食结构',
        text: '你的饮食相关碳足迹较高，建议适当减少高频肉类和外卖消费，增加本地、应季、低包装食品比例，减少食物浪费。',
      })
    }

    if (currentResult.consumption > 25) {
      suggestions.push({
        title: '减少高碳消费',
        text: '你的消费行为碳足迹较高，建议减少一次性用品使用，合并快递订单，减少包装浪费，提升物品重复利用率。',
      })
    }

    if (suggestions.length === 0) {
      suggestions.push({
        title: '继续保持绿色习惯',
        text: '你的绿色生活表现较好，可以继续保持节约用电、绿色出行、理性消费和减少浪费的生活方式。',
      })
    }

    return suggestions
  }

  function buildPotentialItem(item, currentForm) {
    const inputValue = Number(currentForm[item.key] || 0)

    const reductionTextMap = {
      electricity: {
        title: '减少 10% 用电',
        text: `如果本月用电量减少 10%，预计可减少约 ${keepTwo(inputValue * 0.1 * FACTORS.electricity)} kgCO₂。`,
      },
      gas: {
        title: '减少 10% 燃气使用',
        text: `如果本月燃气使用量减少 10%，预计可减少约 ${keepTwo(inputValue * 0.1 * FACTORS.gas)} kgCO₂。`,
      },
      water: {
        title: '减少 10% 用水',
        text: `如果本月用水量减少 10%，预计可减少约 ${keepTwo(inputValue * 0.1 * FACTORS.water)} kgCO₂，同时有助于节约水资源。`,
      },
      car: {
        title: '减少私家车出行',
        text: `如果用公共交通、骑行或步行替代约 ${Math.min(20, inputValue)} 公里私家车出行，预计可减少约 ${keepTwo(Math.min(20, inputValue) * FACTORS.car)} kgCO₂。`,
      },
      taxi: {
        title: '减少网约车/出租车出行',
        text: `如果减少约 ${Math.min(10, inputValue)} 公里网约车或出租车出行，预计可减少约 ${keepTwo(Math.min(10, inputValue) * FACTORS.taxi)} kgCO₂。`,
      },
      flight: {
        title: '减少不必要的飞机出行',
        text: `如果减少约 ${Math.min(100, inputValue)} 公里飞机出行，预计可减少约 ${keepTwo(Math.min(100, inputValue) * FACTORS.flight)} kgCO₂。中短途出行可优先考虑高铁。`,
      },
      train: {
        title: '优化长距离出行安排',
        text: '高铁/火车相对低碳，但如果长距离出行频率较高，也可以通过合并行程、减少非必要出行来进一步降低碳足迹。',
      },
      meat: {
        title: '适度减少高频肉类餐食',
        text: `如果本月减少约 ${Math.min(5, inputValue)} 餐肉类餐食，预计可减少约 ${keepTwo(Math.min(5, inputValue) * FACTORS.meat)} kgCO₂。`,
      },
      dairy: {
        title: '适度优化奶制品消费',
        text: `如果本月减少约 ${Math.min(3, inputValue)} 份奶制品或选择更低碳替代，预计可减少约 ${keepTwo(Math.min(3, inputValue) * FACTORS.dairy)} kgCO₂。`,
      },
      takeaway: {
        title: '减少外卖与包装浪费',
        text: `如果本月减少约 ${Math.min(5, inputValue)} 次外卖，预计可减少约 ${keepTwo(Math.min(5, inputValue) * FACTORS.takeaway)} kgCO₂，同时减少包装垃圾。`,
      },
      express: {
        title: '合并快递订单',
        text: `如果通过合并购买、减少冲动消费等方式减少约 ${Math.min(5, inputValue)} 件快递，预计可减少约 ${keepTwo(Math.min(5, inputValue) * FACTORS.express)} kgCO₂。`,
      },
      disposable: {
        title: '减少一次性用品',
        text: `如果本月减少约 ${Math.min(10, inputValue)} 次一次性用品使用，预计可减少约 ${keepTwo(Math.min(10, inputValue) * FACTORS.disposable)} kgCO₂。`,
      },
      vegetables: {
        title: '减少食物浪费',
        text: '蔬菜类餐食本身相对低碳，重点不是减少摄入，而是合理采购、减少浪费，并优先选择本地应季食材。',
      },
      fruit: {
        title: '选择本地应季水果',
        text: '水果类消费的优化重点在于减少过度包装、减少损耗，并优先选择本地、应季、低运输距离的产品。',
      },
      subway: {
        title: '保持公共交通习惯',
        text: '地铁属于较低碳出行方式。如果你的地铁里程较高，说明你已经在采用相对低碳的出行方式，可继续保持。',
      },
      bus: {
        title: '保持公交出行习惯',
        text: '公交属于较低碳出行方式。如果你的公交里程较高，可以继续保持，并尽量减少同距离下的私家车或网约车替代。',
      },
    }

    return (
      reductionTextMap[item.key] || {
        title: `优化${item.label}`,
        text: `你在“${item.label}”上的碳足迹相对较高，建议根据实际生活场景减少不必要消耗。`,
      }
    )
  }

  function getReductionPotentials(currentForm = form, currentResult = result) {
    if (!currentResult?.detail) return []

    const items = getAllDetailItems(currentResult).filter((item) => item.value > 0)

    if (items.length === 0) {
      return [
        {
          title: '保持当前低碳行为',
          text: '你当前可识别的高排放行为不明显，可以继续保持绿色出行、节约用电、减少浪费等习惯。',
        },
      ]
    }

    const mean = items.reduce((sum, item) => sum + item.value, 0) / items.length
    const sorted = [...items].sort((a, b) => b.value - a.value)

    const aboveMean = sorted.filter((item) => item.value >= mean)
    const selected = []

    for (const item of aboveMean) {
      if (selected.length < 4) selected.push(item)
    }

    for (const item of sorted) {
      if (selected.length >= 4) break
      if (!selected.some((selectedItem) => selectedItem.key === item.key)) {
        selected.push(item)
      }
    }

    return selected.slice(0, 4).map((item) => {
      const potential = buildPotentialItem(item, currentForm)

      return {
        ...potential,
        source: item.label,
        value: item.value,
      }
    })
  }

  function getGreenActions(currentResult = result) {
    if (!currentResult) return []

    const main = getMainSource(currentResult)

    const actions = [
      {
        title: '家庭节能与资源节约',
        text: '减少电器待机、合理使用空调、节约燃气和用水，是个人绿色生活中最容易长期坚持的行动。',
      },
      {
        title: '绿色出行与低碳通勤',
        text: '在通勤、上学、购物和休闲出行中，优先选择步行、骑行、公交、地铁或高铁，减少高碳出行方式。',
      },
      {
        title: '低碳饮食与减少浪费',
        text: '适度优化肉类和外卖频次，选择本地应季食材，减少食物浪费和过度包装。',
      },
      {
        title: '理性消费与循环利用',
        text: '减少冲动消费，合并快递订单，减少一次性用品使用，提升物品重复利用和回收利用比例。',
      },
      {
        title: '城市生态与公共环境保护',
        text: '在公园、河湖、滨水空间、社区绿地等公共环境中，做到垃圾分类投放、减少塑料废弃物、参与生态志愿服务。',
      },
    ]

    if (main.name === '交通出行') {
      actions.unshift({
        title: '优先改善出行结构',
        text: '你的主要排放来源是交通出行。建议从减少短距离私家车和网约车开始，把部分出行替换为步行、骑行或公共交通。',
      })
    }

    if (main.name === '居家能源') {
      actions.unshift({
        title: '优先改善家庭能源使用',
        text: '你的主要排放来源是居家能源。建议优先关注空调、热水、厨房燃气、照明和电器待机等高频生活场景。',
      })
    }

    if (main.name === '饮食习惯') {
      actions.unshift({
        title: '优先改善饮食与外卖习惯',
        text: '你的主要排放来源是饮食习惯。建议减少高频外卖与过度包装，适度优化肉类消费，减少食物浪费。',
      })
    }

    if (main.name === '消费行为') {
      actions.unshift({
        title: '优先改善消费与包装行为',
        text: '你的主要排放来源是消费行为。建议减少一次性用品、合并快递订单、减少冲动消费，并优先选择耐用产品。',
      })
    }

    return actions
  }

  function getYearStats(recordsData) {
    const currentYear = new Date().getFullYear().toString()

    const yearRecords = recordsData
      .filter((record) => record.month && record.month.startsWith(currentYear))
      .sort((a, b) => a.month.localeCompare(b.month))

    if (yearRecords.length === 0) {
      return null
    }

    const total = yearRecords.reduce((sum, record) => sum + record.result.total, 0)
    const average = total / yearRecords.length

    const highest = [...yearRecords].sort((a, b) => b.result.total - a.result.total)[0]
    const lowest = [...yearRecords].sort((a, b) => a.result.total - b.result.total)[0]

    return {
      year: currentYear,
      count: yearRecords.length,
      total: keepTwo(total),
      average: keepTwo(average),
      highest,
      lowest,
    }
  }

  function goToResultFromRecord(record) {
    setResult(record.result)
    setForm(record.form || initialForm)
    setPage('result')
  }

  return (
    <div style={styles.page}>
      <style>
        {`
          @media print {
            nav, .no-print, footer {
              display: none !important;
            }

            body {
              background: white !important;
            }

            main {
              padding: 0 !important;
            }

            section {
              box-shadow: none !important;
            }
          }

          @media (max-width: 640px) {
            h1 {
              font-size: 28px !important;
            }

            h2 {
              font-size: 24px !important;
            }

            button {
              width: 100%;
              margin-right: 0 !important;
            }
          }

          @media (max-width: 760px) {
            .result-visual-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>

      <header style={styles.header}>
        <h1 style={styles.headerTitle}>个人绿色生活与碳足迹指南系统</h1>
        <p style={styles.headerText}>
          测算个人生活碳足迹，识别主要排放来源，生成个性化绿色低碳建议
        </p>
      </header>

      <nav style={styles.nav}>
        <NavButton pageKey="home" currentPage={page} setPage={setPage}>
          首页
        </NavButton>

        <NavButton pageKey="calculator" currentPage={page} setPage={setPage}>
          碳足迹测评
        </NavButton>

        <NavButton pageKey="knowledge" currentPage={page} setPage={setPage}>
          低碳科普
        </NavButton>

        <NavButton pageKey="records" currentPage={page} setPage={setPage}>
          我的记录
        </NavButton>
      </nav>

      <main style={styles.main}>
        {page === 'home' && (
          <section>
            <div style={styles.heroCard}>
              <p style={styles.tag}>从日常生活出发，理解并改善个人碳足迹</p>

              <h2 style={styles.heroTitle}>你的个人绿色生活指南</h2>

              <p style={styles.text}>
                本系统围绕居家能源、交通出行、饮食习惯和消费行为，
                帮助公众估算个人月度生活碳足迹和年度生活碳足迹，
                识别主要碳排放来源，并生成个性化低碳生活建议。
                系统同时提供绿色低碳科普内容，帮助用户理解个人行为与资源节约、气候行动、
                城市生态保护之间的关系。
              </p>

              <button style={styles.mainButton} onClick={() => setPage('calculator')}>
                开始碳足迹测评
              </button>

              <button style={styles.secondaryButton} onClick={() => setPage('knowledge')}>
                查看低碳科普
              </button>
            </div>

            <div style={styles.grid}>
              <InfoCard
                title="个人碳足迹测算"
                text="填写生活数据，系统自动估算个人月度与年度生活碳足迹。"
              />

              <InfoCard
                title="结果解释与环形图"
                text="系统展示总量、分类占比、环形图和分项明细，帮助用户理解主要来源。"
              />

              <InfoCard
                title="针对性减碳建议"
                text="根据高于均值或贡献最高的分项，生成更有针对性的减碳潜力估算。"
              />

              <InfoCard
                title="月度趋势记录"
                text="同一月份只保留一条记录，并展示最近 12 个月生活碳足迹变化趋势。"
              />
            </div>
          </section>
        )}

        {page === 'calculator' && (
          <section style={styles.card}>
            <div style={styles.titleRow}>
              <div>
                <h2 style={styles.pageTitle}>个人生活碳足迹测评</h2>
                <p style={styles.text}>
                  请根据你最近一个月的生活情况填写。没有的项目可以填 0。
                  同一个月份只保留一条测评记录，重复测评会覆盖该月结果。
                  测评月份不能超过当前月份，建议填写最近 5 年以内的数据。
                </p>
              </div>

              <div className="no-print">
                <button style={styles.secondaryButton} onClick={fillSampleData}>
                  填入示例数据
                </button>

                <button style={styles.dangerLightButton} onClick={resetForm}>
                  重置表单
                </button>
              </div>
            </div>

            <h3 style={styles.sectionTitle}>测评月份</h3>

            <label style={styles.inputLabel}>
              <span>请选择月份</span>

              <div style={styles.inputBox}>
                <input
                  type="month"
                  name="month"
                  value={form.month}
                  min={minAllowedMonth}
                  max={maxAllowedMonth}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            </label>

            <h3 style={styles.sectionTitle}>一、居家能源与资源使用</h3>

            <div style={styles.inputGrid}>
              <InputItem label="本月用电量" name="electricity" value={form.electricity} unit="kWh" onChange={handleChange} />
              <InputItem label="本月燃气使用量" name="gas" value={form.gas} unit="m³" onChange={handleChange} />
              <InputItem label="本月用水量" name="water" value={form.water} unit="吨" onChange={handleChange} />
            </div>

            <h3 style={styles.sectionTitle}>二、交通出行：本月大约出行里程</h3>

            <div style={styles.inputGrid}>
              <InputItem label="步行" name="walk" value={form.walk} unit="km" onChange={handleChange} />
              <InputItem label="骑行" name="bike" value={form.bike} unit="km" onChange={handleChange} />
              <InputItem label="地铁" name="subway" value={form.subway} unit="km" onChange={handleChange} />
              <InputItem label="公交" name="bus" value={form.bus} unit="km" onChange={handleChange} />
              <InputItem label="私家车" name="car" value={form.car} unit="km" onChange={handleChange} />
              <InputItem label="网约车/出租车" name="taxi" value={form.taxi} unit="km" onChange={handleChange} />
              <InputItem label="高铁/火车" name="train" value={form.train} unit="km" onChange={handleChange} />
              <InputItem label="飞机" name="flight" value={form.flight} unit="km" onChange={handleChange} />
            </div>

            <h3 style={styles.sectionTitle}>三、饮食习惯：本月大约次数或份数</h3>

            <div style={styles.inputGrid}>
              <InputItem label="肉类餐食" name="meat" value={form.meat} unit="餐" onChange={handleChange} />
              <InputItem label="奶制品" name="dairy" value={form.dairy} unit="份" onChange={handleChange} />
              <InputItem label="蔬菜类餐食" name="vegetables" value={form.vegetables} unit="餐" onChange={handleChange} />
              <InputItem label="水果" name="fruit" value={form.fruit} unit="份" onChange={handleChange} />
              <InputItem label="外卖次数" name="takeaway" value={form.takeaway} unit="次" onChange={handleChange} />
            </div>

            <h3 style={styles.sectionTitle}>四、消费行为：本月大约数量</h3>

            <div style={styles.inputGrid}>
              <InputItem label="快递数量" name="express" value={form.express} unit="件" onChange={handleChange} />
              <InputItem label="一次性用品使用" name="disposable" value={form.disposable} unit="次" onChange={handleChange} />
            </div>

            <div style={styles.noticeBox}>
              <strong>说明：</strong>
              本系统当前为绿色低碳科普与实践展示版本，碳足迹结果为估算值，
              主要用于公众理解个人生活行为与碳排放之间的关系。
            </div>

            <button style={styles.mainButton} onClick={calculateCarbon}>
              生成我的碳足迹报告
            </button>
          </section>
        )}

        {page === 'result' && result && (
          <section style={styles.card}>
            <h2 style={styles.pageTitle}>我的个人碳足迹报告</h2>

            <p style={styles.text}>
              以下结果是根据你填写的数据估算得到，可作为了解个人绿色生活状态的参考。
            </p>

            <div style={styles.resultTopGrid}>
              <div style={styles.totalBox}>
                <p>{result.month || '本月'} 估算生活碳足迹</p>
                <strong>{result.total} kgCO₂</strong>
              </div>

              <div style={styles.annualBox}>
                <p>预计年度生活碳足迹</p>
                <strong>{result.annualTotal} kgCO₂</strong>
              </div>

              <div
                style={{
                  ...styles.levelBox,
                  borderColor: getCarbonLevel(result.total).color,
                }}
              >
                <p style={styles.levelTitle}>你的碳足迹画像</p>

                <h3 style={{ color: getCarbonLevel(result.total).color }}>
                  {getCarbonLevel(result.total).level}
                </h3>

                <p style={styles.text}>{getCarbonLevel(result.total).text}</p>
              </div>
            </div>

            <div style={styles.explanationBox}>
              <h3>{getResultExplanation(result).title}</h3>
              <p>{getResultExplanation(result).text}</p>
            </div>

            <h3 style={styles.sectionTitle}>分类碳足迹结构</h3>

            <div className="result-visual-grid" style={styles.resultVisualGrid}>
              <CategoryPieChart result={result} />

              <div>
                <CarbonBar label="居家能源" value={result.home} total={result.total} />
                <CarbonBar label="交通出行" value={result.transport} total={result.total} />
                <CarbonBar label="饮食习惯" value={result.food} total={result.total} />
                <CarbonBar label="消费行为" value={result.consumption} total={result.total} />
              </div>
            </div>

            <h3 style={styles.sectionTitle}>分类碳足迹情况</h3>

            <div style={styles.grid}>
              <ResultCard title="居家能源" value={result.home} />
              <ResultCard title="交通出行" value={result.transport} />
              <ResultCard title="饮食习惯" value={result.food} />
              <ResultCard title="消费行为" value={result.consumption} />
            </div>

            <h3 style={styles.sectionTitle}>分项碳足迹详情</h3>

            <DetailBreakdown result={result} />

            <h3 style={styles.sectionTitle}>个性化绿色生活建议</h3>

            <div style={styles.suggestionGrid}>
              {getSuggestions(result).map((item, index) => (
                <div key={index} style={styles.suggestionCard}>
                  <h4>{item.title}</h4>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>

            <h3 style={styles.sectionTitle}>针对性减碳潜力估算</h3>

            <p style={styles.text}>
              系统会优先选择高于分项均值或贡献最高的 4 个生活行为，给出更有针对性的减碳建议。
            </p>

            <div style={styles.suggestionGrid}>
              {getReductionPotentials(form, result).map((item, index) => (
                <div key={index} style={styles.potentialCard}>
                  <h4>{item.title}</h4>
                  <p style={styles.miniText}>
                    当前较高分项：{item.source}，约 {item.value} kgCO₂
                  </p>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>

            <h3 style={styles.sectionTitle}>绿色低碳行动拓展建议</h3>

            <div style={styles.suggestionGrid}>
              {getGreenActions(result).map((item, index) => (
                <div key={index} style={styles.waterCard}>
                  <h4>{item.title}</h4>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>

            <div className="no-print">
              <button style={styles.mainButton} onClick={() => setPage('calculator')}>
                重新测评
              </button>

              <button style={styles.secondaryButton} onClick={() => setPage('records')}>
                查看历史记录
              </button>

              <button style={styles.secondaryButton} onClick={printReport}>
                打印 / 保存 PDF 报告
              </button>
            </div>
          </section>
        )}

        {page === 'records' && (
          <section style={styles.card}>
            <div style={styles.titleRow}>
              <div>
                <h2 style={styles.pageTitle}>我的碳足迹记录</h2>

                <p style={styles.text}>
                  这里保存的是当前浏览器中的本地测评记录。同一个月份只保留一条记录。
                  可对单条记录进行查看、修改或删除。
                </p>
              </div>

              {records.length > 0 && (
                <button style={styles.clearButton} onClick={clearRecords}>
                  清空全部记录
                </button>
              )}
            </div>

            {records.length > 0 && <YearStats records={records} getYearStats={getYearStats} />}

            {records.length > 0 && (
              <div style={styles.chartBox}>
                <h3 style={styles.sectionTitle}>最近 12 个月生活碳足迹趋势</h3>
                <MonthlyTrendChart records={records} />
              </div>
            )}

            {records.length === 0 ? (
              <div style={styles.emptyBox}>
                <p>暂无历史测评记录。</p>
                <button style={styles.mainButton} onClick={() => setPage('calculator')}>
                  去测评
                </button>
              </div>
            ) : (
              <div>
                {records.map((record) => (
                  <div key={record.id} style={styles.recordItem}>
                    <div style={styles.titleRow}>
                      <div>
                        <h3>{record.month} 月碳足迹记录</h3>
                        <p>
                          <strong>月度碳足迹：</strong>
                          {record.result.total} kgCO₂
                        </p>
                        <p>
                          <strong>年度估算：</strong>
                          {record.result.annualTotal} kgCO₂
                        </p>
                        <p style={styles.recordDate}>更新时间：{record.date}</p>
                      </div>

                      <div className="no-print">
                        <button
                          style={styles.secondaryButton}
                          onClick={() => goToResultFromRecord(record)}
                        >
                          查看详情
                        </button>

                        <button
                          style={styles.secondaryButton}
                          onClick={() => editRecord(record)}
                        >
                          修改记录
                        </button>

                        <button
                          style={styles.dangerLightButton}
                          onClick={() => deleteRecord(record.id)}
                        >
                          删除记录
                        </button>
                      </div>
                    </div>

                    <div style={styles.grid}>
                      <ResultCard title="居家能源" value={record.result.home} />
                      <ResultCard title="交通出行" value={record.result.transport} />
                      <ResultCard title="饮食习惯" value={record.result.food} />
                      <ResultCard title="消费行为" value={record.result.consumption} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {page === 'knowledge' && (
          <section style={styles.card}>
            <h2 style={styles.pageTitle}>绿色低碳生活科普</h2>

            <p style={styles.text}>
              绿色低碳生活不是单一的环保口号，而是贯穿家庭能源、交通出行、饮食消费、
              资源循环、城市生态和公众参与的日常行动体系。本模块按主题分组整理，
              帮助用户从“理解碳足迹”逐步过渡到“识别重点场景”和“形成长期行动”。
            </p>

            <KnowledgeSection
              title="一、基础认知：理解个人碳足迹"
              intro="这一部分帮助用户理解为什么日常生活行为可以被转化为碳足迹数据，以及为什么记录和比较这些数据有意义。"
              items={[
                {
                  title: '什么是个人碳足迹？',
                  text: '个人碳足迹是指个人在日常生活中由于用电、燃气、用水、出行、饮食、购物、快递和一次性用品使用等行为直接或间接产生的温室气体排放。它可以帮助我们把抽象的绿色低碳理念转化为可观察、可比较、可改善的生活数据。',
                },
                {
                  title: '为什么要关注个人碳足迹？',
                  text: '很多低碳行动看似很小，例如随手关灯、少开一天车、少点一次外卖、少用一次性餐具，但长期累积后会形成明显的减排效果。关注个人碳足迹的意义不是制造负担，而是帮助我们识别最值得优先改善的生活场景。',
                },
                {
                  title: '碳足迹数据应该怎么看？',
                  text: '总量可以帮助我们了解整体水平，分类占比可以帮助我们找到主要来源，趋势记录可以帮助我们观察是否在改善。比起只看一次测评结果，持续记录更能体现生活方式变化。',
                },
              ]}
            />

            <KnowledgeSection
              title="二、生活场景：从高频行为开始改善"
              intro="绿色低碳生活最容易从日常高频行为入手。家庭能源、交通出行、饮食结构和消费行为，是个人生活碳足迹的重要来源。"
              items={[
                {
                  title: '家庭节能应该从哪里开始？',
                  text: '家庭生活中的用电、燃气和用水具有高频、持续、可改善的特点。建议优先关注空调、热水器、冰箱、照明、厨房燃气和电器待机等场景。合理设置空调温度、减少待机耗电、节约热水和燃气，都能降低家庭能源碳足迹。',
                },
                {
                  title: '什么是低碳出行？',
                  text: '低碳出行并不是完全不出行，而是在满足生活和工作需求的前提下，优先选择单位里程排放较低的方式。例如短距离选择步行或骑行，中距离选择公交和地铁，城市间出行优先考虑高铁，减少不必要的私家车、网约车和飞机出行。',
                },
                {
                  title: '如何理解低碳饮食？',
                  text: '低碳饮食不是简单少吃，而是更合理地安排饮食结构。可以适度减少高频肉类和高包装外卖，增加本地、应季、少包装食材的比例，避免过量购买和食物浪费。减少浪费往往比单纯改变食物种类更容易坚持。',
                },
                {
                  title: '外卖和快递为什么会影响碳足迹？',
                  text: '外卖和快递不仅涉及食品或商品本身，还涉及包装、配送、运输和末端处理等环节。频繁外卖、分散下单、过度包装和一次性用品使用都会增加资源消耗。合并订单、减少冲动消费、自带餐具和选择少包装产品都是有效方式。',
                },
              ]}
            />

            <KnowledgeSection
              title="三、资源循环：减少浪费比单次节省更重要"
              intro="绿色生活不只是少消耗，也包括让资源使用更充分、更长久，并减少进入垃圾处理环节的废弃物。"
              items={[
                {
                  title: '一次性用品为什么要少用？',
                  text: '一次性塑料袋、纸杯、餐盒、餐具等用品使用时间很短，但生产、运输和处理都需要消耗资源。减少一次性用品并不复杂，可以从自带水杯、购物袋、餐具和减少瓶装水开始。关键在于把低碳行为变成稳定习惯。',
                },
                {
                  title: '垃圾分类与循环利用有什么价值？',
                  text: '垃圾分类、旧物再利用和资源回收可以减少填埋、焚烧和新材料生产带来的环境压力。可回收物分类投放、旧衣物和电子产品规范回收、减少闲置浪费，都是个人参与循环经济的重要方式。',
                },
                {
                  title: '绿色消费应该怎么做？',
                  text: '绿色消费强调理性、耐用、可循环和少浪费。购买前先判断是否真正需要，优先选择耐用产品、可维修产品、节能产品和少包装产品。相比频繁购买新产品，延长物品使用寿命通常是更有效的低碳行动。',
                },
              ]}
            />

            <KnowledgeSection
              title="四、城市生态：从个人习惯走向公共参与"
              intro="绿色低碳行动不仅发生在家庭中，也体现在公共空间、社区环境和城市生态保护中。个人行动可以通过公共参与进一步放大。"
              items={[
                {
                  title: '城市生态保护与个人有什么关系？',
                  text: '城市生态不仅包括森林和湿地，也包括公园、河湖、水岸空间、社区绿地和街道环境。个人可以通过减少垃圾、保护绿地、参与志愿活动、文明游憩和传播环保知识等方式参与城市生态保护。',
                },
                {
                  title: '低碳生活如何长期坚持？',
                  text: '低碳生活不需要一开始就追求完美。更现实的方式是先找到自己碳足迹最高的生活场景，每月选择一两项容易做到的行动，例如少开车、少外卖、节约用电、减少快递包装，并通过记录观察变化。',
                },
                {
                  title: '个人行动真的有意义吗？',
                  text: '个人行动的意义不仅在于单个人减少了多少排放，也在于形成示范效应和社会参与。家庭、学校、社区和城市中的许多绿色改变，都来自公众认知提升和日常行为改变的累积。',
                },
              ]}
            />

            <div style={styles.actionListBox}>
              <h3 style={styles.sectionTitle}>五、低碳行动清单：可以从这 8 件小事开始</h3>

              <div style={styles.actionListGrid}>
                <ActionItem number="01" text="随手关灯，减少电器待机。" />
                <ActionItem number="02" text="空调温度设置更合理，减少过度制冷或制热。" />
                <ActionItem number="03" text="短距离优先步行、骑行或公共交通。" />
                <ActionItem number="04" text="减少不必要的网约车、私家车和飞机出行。" />
                <ActionItem number="05" text="减少外卖包装和一次性餐具使用。" />
                <ActionItem number="06" text="理性消费，合并快递订单，减少冲动购买。" />
                <ActionItem number="07" text="做好垃圾分类、旧物回收和物品重复利用。" />
                <ActionItem number="08" text="参与社区、公园、河湖和公共空间生态保护。" />
              </div>
            </div>
          </section>
        )}
      </main>

      <footer style={styles.footer}>
        <p>个人绿色生活与碳足迹指南系统</p>
        <p>本系统结果仅供绿色低碳科普、生活改善参考与实践展示使用</p>
      </footer>
    </div>
  )
}

function NavButton({ pageKey, currentPage, setPage, children }) {
  const isActive = pageKey === currentPage

  return (
    <button
      style={isActive ? styles.navButtonActive : styles.navButton}
      onClick={() => setPage(pageKey)}
    >
      {children}
    </button>
  )
}

function InputItem({ label, name, value, unit, onChange }) {
  return (
    <label style={styles.inputLabel}>
      <span>{label}</span>

      <div style={styles.inputBox}>
        <input
          type="number"
          min="0"
          name={name}
          value={value}
          onChange={onChange}
          placeholder="请输入"
          style={styles.input}
        />

        <span style={styles.unit}>{unit}</span>
      </div>
    </label>
  )
}

function InfoCard({ title, text }) {
  return (
    <div style={styles.smallCard}>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}

function ResultCard({ title, value, unit = 'kgCO₂' }) {
  return (
    <div style={styles.resultCard}>
      <p>{title}</p>
      <strong>
        {value}
        {unit ? ` ${unit}` : ''}
      </strong>
    </div>
  )
}

function CarbonBar({ label, value, total }) {
  const percent = formatPercent(value, total)

  return (
    <div style={styles.barItem}>
      <div style={styles.barHeader}>
        <span>{label}</span>
        <span>
          {value} kgCO₂，占比 {percent}%
        </span>
      </div>

      <div style={styles.barBackground}>
        <div
          style={{
            ...styles.barFill,
            width: `${percent}%`,
          }}
        ></div>
      </div>
    </div>
  )
}

function CategoryPieChart({ result }) {
  const categories = [
    { label: '居家能源', value: result.home, color: '#2E7D32' },
    { label: '交通出行', value: result.transport, color: '#26A69A' },
    { label: '饮食习惯', value: result.food, color: '#FFB74D' },
    { label: '消费行为', value: result.consumption, color: '#5C6BC0' },
  ]

  const total = result.total || 0

  if (total <= 0) {
    return <p style={styles.text}>暂无饼状图数据。</p>
  }

  let currentAngle = -90
  const cx = 110
  const cy = 110
  const r = 90

  function polarToCartesian(angle) {
    const rad = (Math.PI / 180) * angle
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    }
  }

  function createArc(startAngle, endAngle) {
    const start = polarToCartesian(startAngle)
    const end = polarToCartesian(endAngle)
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0

    return [
      `M ${cx} ${cy}`,
      `L ${start.x} ${start.y}`,
      `A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
      'Z',
    ].join(' ')
  }

  return (
    <div style={styles.pieBox}>
      <svg viewBox="0 0 220 220" style={styles.pieSvg}>
        {categories.map((item) => {
          if (item.value <= 0) return null

          const angle = (item.value / total) * 360
          const startAngle = currentAngle
          const endAngle = currentAngle + angle
          currentAngle = endAngle

          return (
            <path
              key={item.label}
              d={createArc(startAngle, endAngle)}
              fill={item.color}
              stroke="white"
              strokeWidth="3"
            />
          )
        })}

        <circle cx="110" cy="110" r="50" fill="white" />

        <text
          x="110"
          y="104"
          textAnchor="middle"
          fontSize="15"
          fill="#14532d"
          fontWeight="800"
        >
          总计
        </text>

        <text
          x="110"
          y="126"
          textAnchor="middle"
          fontSize="14"
          fill="#4b5563"
        >
          {result.total} kgCO₂
        </text>
      </svg>

      <div style={styles.pieLegend}>
        {categories.map((item) => {
          const percent = formatPercent(item.value, total)

          return (
            <div key={item.label} style={styles.legendItem}>
              <span
                style={{
                  ...styles.legendColor,
                  backgroundColor: item.color,
                }}
              ></span>
              <span>
                {item.label}：{percent}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DetailBreakdown({ result }) {
  if (!result?.detail) {
    return <p style={styles.text}>暂无分项详情。</p>
  }

  const groups = [
    {
      title: '居家能源',
      data: result.detail.home,
    },
    {
      title: '交通出行',
      data: result.detail.transport,
    },
    {
      title: '饮食习惯',
      data: result.detail.food,
    },
    {
      title: '消费行为',
      data: result.detail.consumption,
    },
  ]

  return (
    <div style={styles.detailGrid}>
      {groups.map((group) => {
        const groupTotal = Object.values(group.data).reduce(
          (sum, value) => sum + Number(value || 0),
          0
        )

        const groupPercent = formatPercent(groupTotal, result.total)

        return (
          <div key={group.title} style={styles.detailCard}>
            <h4>{group.title}</h4>

            {Object.entries(group.data).map(([key, value]) => {
              const percent = formatPercent(value, result.total)

              return (
                <div key={key} style={styles.detailRow}>
                  <span>{getDetailLabel(key)}</span>
                  <strong>
                    {value} kgCO₂｜{percent}%
                  </strong>
                </div>
              )
            })}

            <div style={styles.detailTotalRow}>
              <span>合计</span>
              <strong>
                {Math.round(groupTotal * 100) / 100} kgCO₂｜{groupPercent}%
              </strong>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function YearStats({ records, getYearStats }) {
  const stats = getYearStats(records)

  if (!stats) return null

  return (
    <div style={styles.statsBox}>
      <h3 style={styles.sectionTitle}>{stats.year} 年碳足迹统计</h3>

      <div style={styles.grid}>
        <ResultCard title="已记录月份" value={stats.count} unit="个月" />
        <ResultCard title="年度累计" value={stats.total} />
        <ResultCard title="月均碳足迹" value={stats.average} />
        <ResultCard title={`最高月份 ${stats.highest.month}`} value={stats.highest.result.total} />
        <ResultCard title={`最低月份 ${stats.lowest.month}`} value={stats.lowest.result.total} />
      </div>
    </div>
  )
}

function MonthlyTrendChart({ records }) {
  const endMonth = getCurrentMonth()
  const months = getMonthRange(endMonth, 12)

  const recordMap = new Map()
  records.forEach((record) => {
    if (record.month && record.result) {
      recordMap.set(record.month, record)
    }
  })

  const chartRecords = months.map((month) => {
    const record = recordMap.get(month)
    return {
      month,
      value: record ? record.result.total : null,
    }
  })

  const validValues = chartRecords
    .map((item) => item.value)
    .filter((value) => typeof value === 'number')

  if (validValues.length === 0) {
    return (
      <p style={styles.text}>
        暂无最近 12 个月内的趋势数据。趋势图范围为 {months[0]} 至 {months[months.length - 1]}。
      </p>
    )
  }

  const width = 860
  const height = 300
  const paddingLeft = 58
  const paddingRight = 24
  const paddingTop = 34
  const paddingBottom = 70

  const maxValue = Math.max(...validValues, 1)

  const points = chartRecords.map((item, index) => {
    const x =
      months.length === 1
        ? width / 2
        : paddingLeft +
          (index * (width - paddingLeft - paddingRight)) / (months.length - 1)

    if (item.value === null) {
      return {
        x,
        y: null,
        month: item.month,
        value: null,
      }
    }

    const y =
      paddingTop +
      (1 - item.value / maxValue) * (height - paddingTop - paddingBottom)

    return {
      x,
      y,
      month: item.month,
      value: item.value,
    }
  })

  const segments = []
  let currentSegment = []

  points.forEach((point) => {
    if (point.value === null) {
      if (currentSegment.length >= 2) {
        segments.push(currentSegment)
      }
      currentSegment = []
      return
    }

    currentSegment.push(point)
  })

  if (currentSegment.length >= 2) {
    segments.push(currentSegment)
  }

  return (
    <div style={styles.chartWrapper}>
      <svg viewBox={`0 0 ${width} ${height}`} style={styles.svgChart}>
        <line
          x1={paddingLeft}
          y1={height - paddingBottom}
          x2={width - paddingRight}
          y2={height - paddingBottom}
          stroke="#d1d5db"
          strokeWidth="2"
        />

        <line
          x1={paddingLeft}
          y1={paddingTop}
          x2={paddingLeft}
          y2={height - paddingBottom}
          stroke="#d1d5db"
          strokeWidth="2"
        />

        <text x="8" y={paddingTop + 6} fontSize="12" fill="#6b7280">
          {maxValue} kg
        </text>

        <text x="18" y={height - paddingBottom} fontSize="12" fill="#6b7280">
          0
        </text>

        {segments.map((segment, index) => {
          const polylinePoints = segment.map((point) => `${point.x},${point.y}`).join(' ')

          return (
            <polyline
              key={index}
              points={polylinePoints}
              fill="none"
              stroke="#16a34a"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )
        })}

        {points.map((point) => (
          <g key={point.month}>
            {point.value !== null ? (
              <>
                <circle cx={point.x} cy={point.y} r="5" fill="#16a34a" />

                <text
                  x={point.x}
                  y={point.y - 10}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#14532d"
                  fontWeight="bold"
                >
                  {point.value}
                </text>
              </>
            ) : (
              <circle
                cx={point.x}
                cy={height - paddingBottom}
                r="4"
                fill="white"
                stroke="#d1d5db"
                strokeWidth="2"
              />
            )}

            <text
              x={point.x}
              y={height - 28}
              textAnchor="end"
              fontSize="11"
              fill="#4b5563"
              transform={`rotate(-35 ${point.x} ${height - 28})`}
            >
              {point.month}
            </text>
          </g>
        ))}
      </svg>

      <p style={styles.chartNote}>
        注：趋势图展示最近 12 个月，范围为 {months[0]} 至 {months[months.length - 1]}。
        横轴为年月，纵轴为月度生活碳足迹估算值，单位为 kgCO₂。空心点表示该月暂无记录。
      </p>
    </div>
  )
}

function KnowledgeSection({ title, intro, items }) {
  return (
    <section style={styles.knowledgeSection}>
      <div style={styles.knowledgeSectionHeader}>
        <h3>{title}</h3>
        <p>{intro}</p>
      </div>

      <div style={styles.knowledgeGrid}>
        {items.map((item, index) => (
          <InfoCard key={index} title={item.title} text={item.text} />
        ))}
      </div>
    </section>
  )
}

function ActionItem({ number, text }) {
  return (
    <div style={styles.actionItem}>
      <span style={styles.actionNumber}>{number}</span>
      <p>{text}</p>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f0fdf4',
    fontFamily: 'Microsoft YaHei, Arial, sans-serif',
    color: '#1f2937',
  },

  header: {
    background: 'linear-gradient(135deg, #16a34a, #14532d)',
    color: 'white',
    padding: '48px 24px',
    textAlign: 'center',
  },

  headerTitle: {
    margin: '12px 0',
    fontSize: '38px',
    fontWeight: '800',
  },

  headerText: {
    margin: 0,
    fontSize: '16px',
    opacity: 0.95,
  },

  nav: {
    backgroundColor: 'white',
    padding: '16px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },

  navButton: {
    margin: '6px',
    padding: '10px 20px',
    border: '1px solid #16a34a',
    borderRadius: '999px',
    backgroundColor: 'white',
    color: '#16a34a',
    cursor: 'pointer',
    fontSize: '15px',
  },

  navButtonActive: {
    margin: '6px',
    padding: '10px 20px',
    border: '1px solid #16a34a',
    borderRadius: '999px',
    backgroundColor: '#16a34a',
    color: 'white',
    cursor: 'pointer',
    fontSize: '15px',
  },

  main: {
    maxWidth: '1120px',
    margin: '0 auto',
    padding: '40px 20px',
  },

  heroCard: {
    backgroundColor: 'white',
    borderRadius: '24px',
    padding: '42px',
    boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
    marginBottom: '24px',
    border: '1px solid #dcfce7',
  },

  card: {
    backgroundColor: 'white',
    borderRadius: '24px',
    padding: '36px',
    boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
    marginBottom: '24px',
    border: '1px solid #dcfce7',
  },

  pageTitle: {
    color: '#14532d',
    fontSize: '30px',
    fontWeight: '800',
    marginTop: 0,
    marginBottom: '12px',
    lineHeight: '1.3',
  },

  tag: {
    color: '#15803d',
    fontWeight: 'bold',
    marginBottom: '12px',
  },

  heroTitle: {
    fontSize: '36px',
    marginBottom: '16px',
    color: '#14532d',
    fontWeight: '800',
    lineHeight: '1.3',
  },

  text: {
    lineHeight: '1.8',
    color: '#4b5563',
  },

  miniText: {
    color: '#64748b',
    fontSize: '14px',
    marginBottom: '8px',
  },

  mainButton: {
    marginTop: '20px',
    marginBottom: '16px',
    marginRight: '12px',
    padding: '12px 28px',
    backgroundColor: '#16a34a',
    color: 'white',
    border: 'none',
    borderRadius: '999px',
    fontSize: '16px',
    cursor: 'pointer',
  },

  secondaryButton: {
    marginTop: '20px',
    marginBottom: '16px',
    marginRight: '12px',
    padding: '12px 28px',
    backgroundColor: 'white',
    color: '#16a34a',
    border: '1px solid #16a34a',
    borderRadius: '999px',
    fontSize: '16px',
    cursor: 'pointer',
  },

  dangerLightButton: {
    marginTop: '20px',
    marginBottom: '16px',
    marginRight: '12px',
    padding: '12px 28px',
    backgroundColor: 'white',
    color: '#dc2626',
    border: '1px solid #dc2626',
    borderRadius: '999px',
    fontSize: '16px',
    cursor: 'pointer',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },

  knowledgeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },

  smallCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: '18px',
    padding: '22px',
    marginTop: '16px',
    border: '1px solid #bbf7d0',
    lineHeight: '1.8',
  },

  sectionTitle: {
    marginTop: '28px',
    marginBottom: '16px',
    color: '#14532d',
    fontWeight: '800',
  },

  inputGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },

  inputLabel: {
    display: 'block',
    marginBottom: '16px',
  },

  inputBox: {
    display: 'flex',
    marginTop: '8px',
    border: '1px solid #d1d5db',
    borderRadius: '12px',
    overflow: 'hidden',
  },

  input: {
    flex: 1,
    padding: '12px',
    border: 'none',
    outline: 'none',
    fontSize: '15px',
    minWidth: 0,
  },

  unit: {
    padding: '12px',
    backgroundColor: '#f9fafb',
    color: '#6b7280',
    whiteSpace: 'nowrap',
  },

  noticeBox: {
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '16px',
    padding: '16px',
    marginTop: '24px',
    lineHeight: '1.8',
    color: '#92400e',
  },

  resultTopGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '20px',
    marginTop: '24px',
  },

  totalBox: {
    background: 'linear-gradient(135deg, #16a34a, #15803d)',
    color: 'white',
    borderRadius: '20px',
    padding: '28px',
  },

  annualBox: {
    background: 'linear-gradient(135deg, #0f766e, #115e59)',
    color: 'white',
    borderRadius: '20px',
    padding: '28px',
  },

  levelBox: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    padding: '28px',
    border: '2px solid #16a34a',
  },

  levelTitle: {
    color: '#6b7280',
    marginBottom: '8px',
  },

  explanationBox: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '20px',
    marginTop: '24px',
    lineHeight: '1.8',
  },

  resultVisualGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(260px, 360px) 1fr',
    gap: '24px',
    alignItems: 'center',
  },

  pieBox: {
    background: 'linear-gradient(180deg, #ffffff, #f0fdf4)',
    border: '1px solid #bbf7d0',
    borderRadius: '20px',
    padding: '22px',
    boxShadow: '0 6px 18px rgba(0,0,0,0.05)',
  },

  pieSvg: {
    width: '100%',
    maxWidth: '260px',
    display: 'block',
    margin: '0 auto',
  },

  pieLegend: {
    marginTop: '16px',
    display: 'grid',
    gap: '8px',
  },

  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#374151',
  },

  legendColor: {
    width: '14px',
    height: '14px',
    borderRadius: '4px',
    display: 'inline-block',
  },

  resultCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid #bbf7d0',
  },

  barItem: {
    marginBottom: '18px',
  },

  barHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    fontSize: '14px',
    marginBottom: '8px',
    flexWrap: 'wrap',
  },

  barBackground: {
    height: '14px',
    backgroundColor: '#e5e7eb',
    borderRadius: '999px',
    overflow: 'hidden',
  },

  barFill: {
    height: '100%',
    backgroundColor: '#16a34a',
    borderRadius: '999px',
  },

  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px',
  },

  detailCard: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '18px',
  },

  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '8px 0',
    borderBottom: '1px solid #e5e7eb',
  },

  detailTotalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '10px 0 0',
    marginTop: '6px',
    color: '#14532d',
    fontWeight: '800',
  },

  suggestionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
    marginTop: '16px',
  },

  suggestionCard: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '18px',
    lineHeight: '1.8',
  },

  potentialCard: {
    backgroundColor: '#ecfeff',
    border: '1px solid #a5f3fc',
    borderRadius: '16px',
    padding: '18px',
    lineHeight: '1.8',
  },

  waterCard: {
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '16px',
    padding: '18px',
    lineHeight: '1.8',
  },

  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '20px',
    flexWrap: 'wrap',
  },

  clearButton: {
    padding: '10px 20px',
    border: '1px solid #dc2626',
    borderRadius: '999px',
    backgroundColor: 'white',
    color: '#dc2626',
    cursor: 'pointer',
  },

  statsBox: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '18px',
    padding: '20px',
    marginTop: '20px',
    marginBottom: '20px',
  },

  chartBox: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '18px',
    padding: '20px',
    marginTop: '20px',
    marginBottom: '20px',
  },

  chartWrapper: {
    overflowX: 'auto',
  },

  svgChart: {
    width: '100%',
    minWidth: '760px',
    height: '320px',
    backgroundColor: 'white',
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
  },

  chartNote: {
    fontSize: '13px',
    color: '#6b7280',
    marginTop: '8px',
  },

  recordItem: {
    backgroundColor: '#f9fafb',
    borderRadius: '16px',
    padding: '20px',
    marginTop: '20px',
    border: '1px solid #e5e7eb',
  },

  recordDate: {
    color: '#6b7280',
    fontSize: '14px',
  },

  emptyBox: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '28px',
    marginTop: '20px',
    textAlign: 'center',
  },

  knowledgeSection: {
    marginTop: '28px',
    paddingTop: '8px',
  },

  knowledgeSectionHeader: {
    background: 'linear-gradient(135deg, #f0fdf4, #ecfeff)',
    border: '1px solid #bbf7d0',
    borderRadius: '18px',
    padding: '20px',
    lineHeight: '1.8',
  },

  actionListBox: {
    marginTop: '32px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '20px',
    padding: '22px',
  },

  actionListGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
    marginTop: '18px',
  },

  actionItem: {
    display: 'flex',
    gap: '14px',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    border: '1px solid #dcfce7',
    borderRadius: '16px',
    padding: '16px',
    lineHeight: '1.7',
  },

  actionNumber: {
    backgroundColor: '#16a34a',
    color: 'white',
    fontWeight: '800',
    borderRadius: '999px',
    padding: '6px 10px',
    fontSize: '13px',
    flexShrink: 0,
  },

  footer: {
    textAlign: 'center',
    padding: '28px 20px',
    color: '#4b5563',
    backgroundColor: 'white',
    borderTop: '1px solid #dcfce7',
    lineHeight: '1.8',
  },
}

export default App