/* ======================== */
/*   全局变量与初始化         */
/* ======================== */
let allData = [];
let filteredData = [];
let currentCategory = 'all';
let searchKeyword = '';

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
    setupNavigation();
    setupBackToTop();
});

/* ======================== */
/*   数据加载               */
/* ======================== */
async function loadData() {
    try {
        const response = await fetch('数据源.json');
        if (!response.ok) throw new Error('数据加载失败');
        const json = await response.json();
        allData = json.destinations;
        filteredData = [...allData];
        renderCards(filteredData);
        updateStats();
        drawCharts();
        renderTagCloud();
    } catch (error) {
        console.error('加载数据出错:', error);
        document.getElementById('cardGrid').innerHTML = '<p style="text-align:center;color:#718096;grid-column:1/-1;">数据加载失败，请刷新页面重试</p>';
    }
}

/* ======================== */
/*   事件监听               */
/* ======================== */
function setupEventListeners() {
    // 分类筛选
    document.getElementById('filterTabs').addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            currentCategory = e.target.dataset.category;
            applyFilters();
        }
    });

    // 关键词搜索（实时搜索）
    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchKeyword = e.target.value.trim().toLowerCase();
        applyFilters();
    });

    // 弹窗关闭
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal();
    });

    // ESC 关闭弹窗
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // 移动端菜单
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.querySelector('.nav').classList.toggle('open');
    });
}

/* ======================== */
/*   导航高亮               */
/* ======================== */
function setupNavigation() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

/* ======================== */
/*   返回顶部               */
/* ======================== */
function setupBackToTop() {
    const btn = document.getElementById('backToTop');
    window.addEventListener('scroll', () => {
        btn.style.display = window.scrollY > 400 ? 'flex' : 'none';
    });
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/* ======================== */
/*   筛选逻辑               */
/* ======================== */
function applyFilters() {
    filteredData = allData.filter(item => {
        const matchCategory = currentCategory === 'all' || item.continent === currentCategory;
        const matchSearch = searchKeyword === '' || 
            item.name.toLowerCase().includes(searchKeyword) ||
            item.country.toLowerCase().includes(searchKeyword) ||
            item.description.toLowerCase().includes(searchKeyword) ||
            item.tags.some(tag => tag.toLowerCase().includes(searchKeyword));
        return matchCategory && matchSearch;
    });

    renderCards(filteredData);
    updateResultCount(filteredData.length);
}

function updateResultCount(count) {
    document.getElementById('resultCount').textContent = `共 ${count} 个目的地`;
}

/* ======================== */
/*   卡片渲染               */
/* ======================== */
function renderCards(data) {
    const grid = document.getElementById('cardGrid');
    const emptyState = document.getElementById('emptyState');

    if (data.length === 0) {
        grid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    grid.innerHTML = data.map(item => `
        <div class="card" data-id="${item.id}">
            <div class="card-image">
                <img src="${item.image}" alt="${item.name}" onerror="this.style.display='none'; this.parentElement.innerHTML='<span class=\\'placeholder-icon\\'>🌍</span><div class=\\'card-badge\\'>${item.continent}</div>';">
                <div class="card-badge">${item.continent}</div>
            </div>
            <div class="card-body">
                <h3 class="card-title">${item.name}</h3>
                <p class="card-country">📍 ${item.country}</p>
                <p class="card-desc">${item.description}</p>
                <div class="card-footer">
                    <div class="card-rating">
                        <span class="stars">${getStars(item.rating)}</span>
                        <span class="rating-num">${item.rating}.0</span>
                    </div>
                    <div class="card-tags">
                        ${item.tags.slice(0, 2).map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    // 添加卡片点击事件
    grid.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => {
            const id = parseInt(card.dataset.id);
            openModal(id);
        });
    });
}

/* ======================== */
/*   星级显示               */
/* ======================== */
function getStars(rating) {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

/* ======================== */
/*   详情弹窗               */
/* ======================== */
function openModal(id) {
    const item = allData.find(d => d.id === id);
    if (!item) return;

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="modal-image">
            <img src="${item.image}" alt="${item.name}" onerror="this.style.display='none'; this.parentElement.innerHTML='<span style=\\'font-size:5rem\\'>🌍</span>';">
        </div>
        <div class="modal-content">
            <h2>${item.name}</h2>
            <p class="modal-country">📍 ${item.country} · ${item.continent}</p>
            <p class="modal-desc">${item.description}</p>
            <div class="modal-info-grid">
                <div class="modal-info-item">
                    <div class="label">推荐评分</div>
                    <div class="value">${getStars(item.rating)} ${item.rating}.0/5.0</div>
                </div>
                <div class="modal-info-item">
                    <div class="label">最佳季节</div>
                    <div class="value">${item.bestSeason}</div>
                </div>
                <div class="modal-info-item">
                    <div class="label">预算等级</div>
                    <div class="value">${item.budget}</div>
                </div>
                <div class="modal-info-item">
                    <div class="label">旅行天数</div>
                    <div class="value">${item.duration} 天</div>
                </div>
            </div>
            <div class="modal-tags">
                ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </div>
    `;

    document.getElementById('modalOverlay').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
    document.body.style.overflow = '';
}

/* ======================== */
/*   数据统计               */
/* ======================== */
function updateStats() {
    // 目的地总数
    document.getElementById('totalDestinations').textContent = allData.length;

    // 涉及大洲数
    const continents = [...new Set(allData.map(d => d.continent))];
    document.getElementById('totalContinents').textContent = continents.length;

    // 平均评分
    const avgRating = (allData.reduce((sum, d) => sum + d.rating, 0) / allData.length).toFixed(1);
    document.getElementById('avgRating').textContent = avgRating;

    // 总旅行天数
    const totalDays = allData.reduce((sum, d) => sum + d.duration, 0);
    document.getElementById('totalDays').textContent = totalDays;
}

/* ======================== */
/*   图表绘制（Canvas）      */
/* ======================== */
function drawCharts() {
    drawBarChart();
    drawPieChart();
    drawLineChart();
}

// 柱状图：各大洲旅行数量
function drawBarChart() {
    const canvas = document.getElementById('barChart');
    const ctx = canvas.getContext('2d');
    
    // 设置画布尺寸
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = 300 * 2;
    ctx.scale(2, 2);
    
    const width = canvas.offsetWidth;
    const height = 300;
    
    // 统计数据
    const continentCount = {};
    allData.forEach(d => {
        continentCount[d.continent] = (continentCount[d.continent] || 0) + 1;
    });
    
    const labels = Object.keys(continentCount);
    const values = Object.values(continentCount);
    const maxVal = Math.max(...values);
    
    const colors = ['#667eea', '#ed8936', '#38a169', '#805ad5'];
    
    // 图表参数
    const padding = { top: 20, right: 20, bottom: 60, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const barWidth = chartWidth / labels.length * 0.6;
    const barGap = chartWidth / labels.length * 0.4;
    
    // 绘制坐标轴
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    
    // Y轴刻度
    const gridLines = 5;
    ctx.fillStyle = '#718096';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= gridLines; i++) {
        const y = padding.top + chartHeight - (chartHeight * i / gridLines);
        const val = Math.round(maxVal * i / gridLines);
        ctx.fillText(val, padding.left - 8, y + 4);
        
        if (i > 0) {
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();
        }
    }
    
    // 绘制柱形
    labels.forEach((label, i) => {
        const x = padding.left + (chartWidth / labels.length) * i + barGap / 2;
        const barH = (values[i] / maxVal) * chartHeight;
        const y = padding.top + chartHeight - barH;
        
        // 柱形阴影
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(x + 3, y + 3, barWidth, barH);
        
        // 柱形渐变
        const gradient = ctx.createLinearGradient(x, y, x, y + barH);
        gradient.addColorStop(0, colors[i % colors.length]);
        gradient.addColorStop(1, colors[i % colors.length] + '88');
        ctx.fillStyle = gradient;
        
        // 圆角矩形
        const radius = 6;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        ctx.lineTo(x + barWidth, y + barH);
        ctx.lineTo(x, y + barH);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
        
        // 数值标签
        ctx.fillStyle = '#2d3748';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(values[i], x + barWidth / 2, y - 8);
        
        // X轴标签
        ctx.fillStyle = '#4a5568';
        ctx.font = '13px sans-serif';
        ctx.fillText(label, x + barWidth / 2, height - padding.bottom + 20);
    });
}

// 饼图：预算等级分布
function drawPieChart() {
    const canvas = document.getElementById('pieChart');
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = 300 * 2;
    ctx.scale(2, 2);
    
    const width = canvas.offsetWidth;
    const height = 300;
    
    // 统计数据
    const budgetCount = {};
    allData.forEach(d => {
        budgetCount[d.budget] = (budgetCount[d.budget] || 0) + 1;
    });
    
    const labels = Object.keys(budgetCount);
    const values = Object.values(budgetCount);
    const total = values.reduce((a, b) => a + b, 0);
    
    const colors = ['#667eea', '#ed8936', '#38a169', '#805ad5', '#e53e3e'];
    
    // 绘制饼图
    const centerX = width * 0.35;
    const centerY = height / 2;
    const radius = Math.min(width * 0.3, height * 0.38);
    
    let startAngle = -Math.PI / 2;
    
    labels.forEach((label, i) => {
        const sliceAngle = (values[i] / total) * 2 * Math.PI;
        
        // 绘制扇形
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, colors[i % colors.length]);
        gradient.addColorStop(1, colors[i % colors.length] + 'CC');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 边框
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        startAngle += sliceAngle;
    });
    
    // 中心圆（甜甜圈效果）
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.5, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    
    // 中心文字
    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${total}个`, centerX, centerY - 8);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#718096';
    ctx.fillText('目的地', centerX, centerY + 12);
    
    // 图例
    const legendX = width * 0.68;
    let legendY = height * 0.2;
    
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    labels.forEach((label, i) => {
        const percent = ((values[i] / total) * 100).toFixed(1);
        
        // 颜色块
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(legendX, legendY - 8, 16, 16);
        
        // 文字
        ctx.fillStyle = '#2d3748';
        ctx.font = '13px sans-serif';
        ctx.fillText(`${label}`, legendX + 24, legendY);
        
        ctx.fillStyle = '#718096';
        ctx.font = '12px sans-serif';
        ctx.fillText(`${values[i]}个 (${percent}%)`, legendX + 24, legendY + 18);
        
        legendY += 50;
    });
}

// 折线图：年度旅行次数趋势
function drawLineChart() {
    const canvas = document.getElementById('lineChart');
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = 300 * 2;
    ctx.scale(2, 2);
    
    const width = canvas.offsetWidth;
    const height = 300;
    
    // 按年份统计
    const yearCount = {};
    allData.forEach(d => {
        yearCount[d.visitYear] = (yearCount[d.visitYear] || 0) + 1;
    });
    
    const sortedYears = Object.keys(yearCount).sort();
    const values = sortedYears.map(y => yearCount[y]);
    const maxVal = Math.max(...values) + 1;
    
    // 图表参数
    const padding = { top: 20, right: 20, bottom: 50, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // 网格线
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    
    const gridLines = 5;
    ctx.fillStyle = '#718096';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= gridLines; i++) {
        const y = padding.top + chartHeight - (chartHeight * i / gridLines);
        const val = Math.round(maxVal * i / gridLines);
        ctx.fillText(val, padding.left - 8, y + 4);
        
        if (i > 0) {
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();
        }
    }
    
    // 计算数据点坐标
    const points = sortedYears.map((year, i) => ({
        x: padding.left + (chartWidth / (sortedYears.length - 1 || 1)) * i,
        y: padding.top + chartHeight - (values[i] / maxVal) * chartHeight,
        value: values[i],
        year: year
    }));
    
    // 绘制面积
    if (points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, padding.top + chartHeight);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(points[points.length - 1].x, padding.top + chartHeight);
        ctx.closePath();
        
        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
        gradient.addColorStop(0, 'rgba(102, 126, 234, 0.3)');
        gradient.addColorStop(1, 'rgba(102, 126, 234, 0.02)');
        ctx.fillStyle = gradient;
        ctx.fill();
    }
    
    // 绘制线条
    if (points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.stroke();
    }
    
    // 绘制数据点
    points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#667eea';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 数值
        ctx.fillStyle = '#2d3748';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.value, p.x, p.y - 15);
    });
    
    // X轴标签
    ctx.fillStyle = '#4a5568';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    points.forEach(p => {
        ctx.fillText(p.year, p.x, height - padding.bottom + 20);
    });
}

/* ======================== */
/*   标签云                 */
/* ======================== */
function renderTagCloud() {
    const tagCount = {};
    allData.forEach(d => {
        d.tags.forEach(tag => {
            tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
    });
    
    const sortedTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]);
    
    const tagCloud = document.getElementById('tagCloud');
    tagCloud.innerHTML = sortedTags.map(([tag, count]) => 
        `<span class="cloud-tag" style="font-size: ${0.8 + count * 0.1}rem">${tag} (${count})</span>`
    ).join('');
}
