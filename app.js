// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Данные квиза - болевые вопросы
const quizData = [
    {
        id: 1,
        title: "Сколько соцсетей ведёт ваш бизнес?",
        subtitle: "Каждая неохваченная площадка = упущенные клиенты",
        answers: [
            { text: "1-2 соцсети", value: "low", multiplier: 1.2 },
            { text: "3-4 соцсети", value: "medium", multiplier: 1.5 },
            { text: "5+ соцсетей или не ведём", value: "high", multiplier: 2.0 },
            { text: "Не знаю / Запутался", value: "confused", multiplier: 1.8 }
        ]
    },
    {
        id: 2,
        title: "Сколько часов в день тратите на контент?",
        subtitle: "Ваше время стоит дороже, чем вы думаете",
        answers: [
            { text: "Не трачу времени (не веду)", value: "none", hours: 0, loss: 50000 },
            { text: "1-2 часа в день", value: "low", hours: 45, loss: 30000 },
            { text: "3-4 часа в день", value: "medium", hours: 90, loss: 15000 },
            { text: "Более 4 часов или есть SMM-щик", value: "high", hours: 120, loss: 0 }
        ]
    },
    {
        id: 3,
        title: "Как часто публикуете контент?",
        subtitle: "Алгоритмы любят регулярность. Разрозненные посты не работают",
        answers: [
            { text: "Раз в неделю или реже", value: "rare", frequency: 0.5 },
            { text: "2-3 раза в неделю", value: "medium", frequency: 0.8 },
            { text: "Ежедневно", value: "daily", frequency: 1.0 },
            { text: "Нет системы / когда есть время", value: "chaos", frequency: 0.3 }
        ]
    },
    {
        id: 4,
        title: "Сколько тратите на SMM сейчас?",
        subtitle: "Включая зарплаты, фрилансеров, рекламу",
        answers: [
            { text: "Ничего не трачу", value: "zero", cost: 0 },
            { text: "20 000 - 50 000 ₽/мес", value: "low", cost: 35000 },
            { text: "50 000 - 100 000 ₽/мес", value: "medium", cost: 75000 },
            { text: "Более 100 000 ₽/мес", value: "high", cost: 120000 }
        ]
    },
    {
        id: 5,
        title: "Какой контент создаёте?",
        subtitle: "Разные форматы для разных площадок = больше охват",
        answers: [
            { text: "Только текстовые посты", value: "text", contentValue: 0.4 },
            { text: "Тексты + картинки", value: "images", contentValue: 0.7 },
            { text: "Всё включая видео/Reels", value: "video", contentValue: 1.0 },
            { text: "Нет времени на качественный контент", value: "none", contentValue: 0.2 }
        ]
    },
    {
        id: 6,
        title: "Средний чек вашего клиента?",
        subtitle: "Для расчёта реальной упущенной прибыли",
        answers: [
            { text: "До 5 000 ₽", value: "small", check: 3000 },
            { text: "5 000 - 20 000 ₽", value: "medium", check: 12000 },
            { text: "20 000 - 50 000 ₽", value: "high", check: 35000 },
            { text: "Более 50 000 ₽", value: "premium", check: 75000 }
        ]
    }
];

// Константы ценообразования (ваши реальные цены)
const PRICING = {
    setup: 160000,
    monthly: 20000,
    yearlyTotal: 400000, // 160к + (20к * 12)
    monthlyEffective: 33333 // 400к / 12
};

// Состояние
let currentQuestion = 0;
let answers = {};
let userData = {
    networks: 1,
    hours: 0,
    frequency: 0.5,
    currentCost: 0,
    contentValue: 0.4,
    avgCheck: 3000
};

// Начать аудит
function startAudit() {
    tg.HapticFeedback.impactOccurred('medium');
    showScreen('quiz-screen');
    loadQuestion();
}

// Загрузить вопрос
function loadQuestion() {
    const q = quizData[currentQuestion];
    
    // Обновление прогресса
    const progress = ((currentQuestion) / quizData.length) * 100;
    document.getElementById('progress-fill').style.width = progress + '%';
    document.getElementById('current-q').textContent = currentQuestion + 1;
    document.getElementById('total-q').textContent = quizData.length;
    
    // Текст вопроса
    document.getElementById('question-number').textContent = `ВОПРОС ${currentQuestion + 1}`;
    document.getElementById('question-title').textContent = q.title;
    document.getElementById('question-subtitle').textContent = q.subtitle;
    
    // Кнопки ответов
    const container = document.getElementById('answers-container');
    container.innerHTML = '';
    
    q.answers.forEach((answer, index) => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.innerHTML = `<div style="font-weight: 600;">${answer.text}</div>`;
        btn.onclick = () => selectAnswer(answer, index);
        container.appendChild(btn);
    });
}

// Выбор ответа
function selectAnswer(answer, index) {
    tg.HapticFeedback.impactOccurred('light');
    
    // Сохраняем данные
    const q = quizData[currentQuestion];
    answers[q.id] = answer;
    
    // Обновляем userData для расчётов
    updateUserData(q.id, answer);
    
    // Анимация выбора
    const buttons = document.querySelectorAll('.answer-btn');
    buttons.forEach((btn, i) => {
        btn.classList.add('disabled');
        if (i === index) btn.classList.add('selected');
    });
    
    // Переход далее
    setTimeout(() => {
        currentQuestion++;
        if (currentQuestion < quizData.length) {
            loadQuestion();
        } else {
            showCalculating();
        }
    }, 400);
}

// Обновление данных пользователя
function updateUserData(questionId, answer) {
    switch(questionId) {
        case 1:
            userData.networks = answer.value === 'high' ? 6 : answer.value === 'medium' ? 4 : 2;
            break;
        case 2:
            userData.hours = answer.hours || 0;
            break;
        case 3:
            userData.frequency = answer.frequency || 0.5;
            break;
        case 4:
            userData.currentCost = answer.cost || 0;
            break;
        case 5:
            userData.contentValue = answer.contentValue || 0.4;
            break;
        case 6:
            userData.avgCheck = answer.check || 3000;
            break;
    }
}

// Экран расчёта
function showCalculating() {
    showScreen('calculating-screen');
    
    // Анимация шагов
    setTimeout(() => {
        document.getElementById('step1').classList.add('active');
        tg.HapticFeedback.impactOccurred('light');
    }, 500);
    
    setTimeout(() => {
        document.getElementById('step2').classList.add('active');
        tg.HapticFeedback.impactOccurred('light');
    }, 1500);
    
    setTimeout(() => {
        document.getElementById('step3').classList.add('active');
        tg.HapticFeedback.notificationOccurred('success');
    }, 2500);
    
    setTimeout(() => {
        calculateAndShowResults();
    }, 3500);
}

// Расчёт результатов — ИСПРАВЛЕННАЯ ВЕРСИЯ
function calculateAndShowResults() {
    // === ИСПРАВЛЕННАЯ ЛОГИКА РАСЧЁТА ===
    
    // 1. Упущенная прибыль (потенциальные клиенты, которых нет из-за неэффективного SMM)
    // Формула: количество соцсетей × частота публикаций × качество контента × базовый охват
    const potentialReach = userData.networks * userData.frequency * userData.contentValue * 100;
    const conversionRate = 0.05; // 5% конверсия в лиды
    const potentialClients = Math.floor(potentialReach * conversionRate);
    const moneyLoss = potentialClients * userData.avgCheck;
    
    // 2. Время впустую (часы в месяц, потраченные на ручной SMM)
    const hoursPerMonth = userData.hours * 4.3; // 4.3 недели в месяце
    const hourValue = 2000; // стоимость часа работодателя/предпринимателя
    const timeLossValue = hoursPerMonth * hourValue;
    
    // 3. Переплата (разница между текущими затратами и стоимостью Кинейро)
    // Если текущие затраты больше — это переплата
    const currentMonthlySpend = userData.currentCost;
    const kineiroMonthly = PRICING.monthlyEffective; // ~33 333 ₽
    const overpayment = Math.max(0, currentMonthlySpend - kineiroMonthly);
    
    // 4. Общие текущие затраты (деньги + время)
    const totalCurrentSpend = currentMonthlySpend + timeLossValue;
    
    // 5. Экономия = текущие затраты - стоимость Кинейро
    // (но не учитываем упущенную прибыль как экономию — это отдельная история)
    const realSavings = Math.max(0, totalCurrentSpend - kineiroMonthly);
    
    // === ОТОБРАЖЕНИЕ РЕЗУЛЬТАТОВ ===
    
    // Упущенная прибыль
    document.getElementById('money-loss').textContent = formatMoney(moneyLoss) + '/мес';
    
    // Время
    document.getElementById('time-loss').textContent = Math.round(hoursPerMonth) + ' часов';
    
    // Переплата (если есть)
    document.getElementById('cost-loss').textContent = formatMoney(overpayment) + '/мес';
    
    // Текущие общие затраты
    document.getElementById('current-spend').textContent = formatMoney(totalCurrentSpend) + '/мес';
    
    // Реальная экономия
    document.getElementById('savings').textContent = formatMoney(realSavings) + '/мес';
    
    showScreen('result-screen');
    
    // Настройка главной кнопки Telegram
    tg.MainButton.setText('Получить консультацию');
    tg.MainButton.show();
    tg.MainButton.onClick(openConsultation);
}

// Форматирование денег
function formatMoney(amount) {
    return Math.floor(amount).toLocaleString('ru-RU') + ' ₽';
}

// Показать экран
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// Открыть консультацию
function openConsultation() {
    tg.HapticFeedback.notificationOccurred('success');
    
    // Отправка данных боту
    const resultData = {
        action: 'consultation_request',
        money_loss: document.getElementById('money-loss').textContent,
        time_loss: document.getElementById('time-loss').textContent,
        savings: document.getElementById('savings').textContent,
        pricing: {
            setup: PRICING.setup,
            monthly: PRICING.monthly,
            yearly: PRICING.yearlyTotal
        },
        answers: answers
    };
    
    tg.sendData(JSON.stringify(resultData));
    
    // Показываем popup
    tg.showPopup({
        title: 'Заявка принята!',
        message: 'Мы проанализировали ваши потери. Наш менеджер свяжется с вами в течение 15 минут с персональным планом экономии.',
        buttons: [{id: 'ok', text: 'Отлично!', type: 'default'}]
    });
}

// Поделиться результатом
function shareResult() {
    const savings = document.getElementById('savings').textContent;
    const text = `📊 Провёл аудит соцсетей и узнал шокирующую правду!\n\n` +
                 `💸 Упускаю: ${document.getElementById('money-loss').textContent}\n` +
                 `⏰ Трачу впустую: ${document.getElementById('time-loss').textContent}\n` +
                 `✅ Могу сэкономить: ${savings}\n\n` +
                 `Проверь свой бизнес 👇`;
    
    tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`);
}

// Обработка кнопки назад
tg.BackButton.onClick(() => {
    if (currentQuestion > 0 && document.getElementById('quiz-screen').classList.contains('active')) {
        currentQuestion--;
        loadQuestion();
    } else if (document.getElementById('result-screen').classList.contains('active')) {
        tg.showConfirm('Вернуться к началу? Все данные будут потеряны.', (confirmed) => {
            if (confirmed) {
                tg.MainButton.hide();
                currentQuestion = 0;
                answers = {};
                showScreen('welcome-screen');
            }
        });
    } else {
        tg.close();
    }
});

// Показываем кнопку назад на квизе и результате
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.target.classList.contains('active')) {
            const id = mutation.target.id;
            if (id === 'quiz-screen' || id === 'result-screen' || id === 'calculating-screen') {
                tg.BackButton.show();
            } else {
                tg.BackButton.hide();
            }
        }
    });
});

document.querySelectorAll('.screen').forEach(screen => {
    observer.observe(screen, { attributes: true, attributeFilter: ['class'] });
});

