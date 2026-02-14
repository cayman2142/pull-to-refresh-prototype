# Handoff: Pull-to-Refresh для React Native

## 1. Обзор

Прототип — pull-to-refresh с Lottie-анимациями и spring-физикой (Framer Motion). Фиксированная шапка (header bar) всегда сверху; под ней зона лоадера, которая выезжает при подтягивании (высота 0 … headerHeight). Контент (карточки) скроллится под зоной лоадера.

**Референс:**
- Репозиторий: https://github.com/cayman2142/pull-to-refresh-prototype
- Деплой (Vercel): см. README или настройки проекта

---

## 2. Конечный автомат (состояния)

Переходы:

```
idle → dragging → bouncing → landing → loading → closing → idle
```

| Из | В | Условие |
|----|---|--------|
| idle | dragging | Пользователь тянет вниз при scrollTop === 0 |
| dragging | bouncing | Отпускание при pullDistance >= threshold; вызывается onTriggerRefresh(releaseDistance) в requestAnimationFrame |
| bouncing | landing | Окончание spring-анимации высоты зоны лоадера (от releaseHeight до headerHeight) |
| landing | loading | Окончание spring-анимации scale логотипа (от landingPopScale к 1) |
| loading | closing | По таймеру loadingDurationMs |
| closing | idle | Окончание spring-анимации высоты зоны лоадера (от headerHeight до 0) |

---

## 3. Жесты и данные

- **Активация:** только когда scroll контента вверху (scrollTop === 0).
- **pullDistance:** 0 … maxPull (жёсткий лимит в px).
- **progress:** pullDistance / maxPull (0 … 1), используется для прогресса Lottie и масштаба логотипа.
- **Порог срабатывания:** при отпускании pullDistance >= threshold → trigger refresh.
- **Важно:** вызов onTriggerRefresh(releaseDistance) должен выполняться в requestAnimationFrame после отпускания, чтобы UI успел отрисоваться перед сменой состояния.

---

## 4. Параметры (таблица для RN)

| Группа | Параметр | Тип | По умолчанию | Описание |
|--------|----------|-----|--------------|----------|
| Pull | pullThreshold | number | 80 | Порог (px), при превышении при отпускании — refresh |
| Pull | pullMaxPull | number | 120 | Макс. расстояние тяги (px) |
| Logo | logoGrowMax | number | 0.25 | Рост логотипа при тяге: scale = 1 + progress * logoGrowMax |
| Logo | completePopBump | number | 1.15 | Scale при «попе» при 100% (затем spring обратно к 1) |
| Logo | completePopDelayMs | number | 50 | Задержка (ms) перед spring обратно к 1 после попа |
| Logo | completePopStiffness | number | 600 | Spring «complete pop» (возврат scale к 1) |
| Logo | completePopDamping | number | 15 | |
| Logo | completePopMass | number | 1 | |
| Bounce | bounceStiffness | number | 600 | Spring высоты зоны лоадера (bouncing и closing) |
| Bounce | bounceDamping | number | 15 | |
| Bounce | bounceMass | number | 1 | |
| Landing | landingPopScale | number | 1.08 | Scale логотипа в фазе landing (затем spring к 1) |
| Landing | landingPopUpMs | number | 80 | Задержка (ms) перед spring scale к 1 в landing |
| Landing | landingStiffness | number | 400 | Spring scale в landing (к 1) |
| Landing | landingDamping | number | 30 | |
| Landing | landingMass | number | 1 | |
| Loading | loadingDurationMs | number | 6000 | Длительность показа лоадера до перехода в closing |
| Layout | headerHeight | number | 80 | Высота зоны лоадера в состоянии «открыто» (bouncing/landing/loading) |

**Пресеты (опционально):** можно предлагать выбор стиля spring для каждой группы (Logo, Bounce, Landing) независимо:
- default — кастом (значения из ползунков)
- smooth — stiffness 400, damping 35, mass 1
- veryBouncy — stiffness 800, damping 12, mass 0.8
- calm — stiffness 280, damping 42, mass 1

---

## 5. Важные детали реализации (Web)

- **Double requestAnimationFrame:** перед установкой целевой высоты в фазе bouncing нужно сначала отрисовать текущую высоту (releaseHeight), затем в следующем кадре задать цель (headerHeight). Иначе spring-анимация не будет видна (браузер отрисует уже финальное состояние).
- **Фиксированная шапка:** header bar всегда сверху; анимируется только зона под ней (высота 0 … headerHeight).
- **Lottie:** два JSON — «drag» (прогресс по progress, 100 кадров) и «loading» (loop). В фазах bouncing/landing drag Lottie держится на последнем кадре.

---

## 6. Маппинг на React Native

- **Spring:** Framer Motion → Reanimated 2 `withSpring(config)` или аналог; config: `{ stiffness, damping, mass }`.
- **Touch:** хук с pointer/touch событиями → PanResponder или react-native-gesture-handler. Нужны: scrollTop, pull distance (0…maxPull), threshold, maxPull, onTriggerRefresh(releaseDistance) в requestAnimationFrame.
- **Lottie:** lottie-react-native; те же JSON из репозитория (public/drag-animation.json, public/loading-animation.json).
- **Высота зоны:** Animated или Reanimated value для высоты контейнера под шапкой; в bouncing/closing — spring к целевой высоте.
