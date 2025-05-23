# Track Stack Backend

Бэкенд для платформы отслеживания прогресса обучения по различным роадмапам, навыкам и задачам.

## API Endpoints

### Пользователи (Users)

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| GET | `/api/users` | Получение списка всех пользователей |
| GET | `/api/users/:userId` | Получение информации о пользователе по ID |
| POST | `/api/users` | Создание нового пользователя (email, password) |
| PUT | `/api/users/:userId` | Обновление данных пользователя |
| DELETE | `/api/users/:userId` | Удаление пользователя |
| DELETE | `/api/users/:userId/data` | Очистка всех данных пользователя (роадмапы, скиллы, задачи) |

### Роадмапы (Roadmaps)

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| GET | `/api/roadmaps` | Получение списка всех роадмапов |
| GET | `/api/roadmaps/:id` | Получение информации о роадмапе по ID |
| POST | `/api/roadmaps` | Создание нового роадмапа |
| PUT | `/api/roadmaps/:id` | Обновление данных роадмапа |
| DELETE | `/api/roadmaps/:id` | Удаление роадмапа |
| GET | `/api/roadmaps/user/:userId` | Получение всех роадмапов пользователя |
| POST | `/api/roadmaps/:roadmapId/user/:userId` | Добавление роадмапа пользователю |
| DELETE | `/api/roadmaps/:roadmapId/user/:userId` | Удаление роадмапа у пользователя |
| PUT | `/api/roadmaps/:roadmapId/user/:userId/progress` | Обновление прогресса роадмапа у пользователя |
| GET | `/api/roadmaps/:roadmapId/user/:userId/tasks` | Получение задач пользователя для конкретного роадмапа |
| GET | `/api/roadmaps/:roadmapId/user/:userId/progress` | Расчет текущего прогресса роадмапа |
| DELETE | `/api/roadmaps/user/:userId/all` | Удаление всех роадмапов пользователя |
| POST | `/api/roadmaps/:roadmapId/skills/:skillId` | Добавление навыка к роадмапу |

### Навыки (Skills)

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| GET | `/api/skills` | Получение списка всех навыков (опционально с фильтром по roadmapId) |
| GET | `/api/skills/:id` | Получение информации о навыке по ID |
| POST | `/api/skills` | Создание нового навыка |
| PUT | `/api/skills/:id` | Обновление данных навыка |
| DELETE | `/api/skills/:id` | Удаление навыка |
| GET | `/api/skills/user/:userId` | Получение навыков пользователя (опционально с фильтром по roadmapId) |
| POST | `/api/skills/:skillId/user/:userId` | Добавление навыка пользователю |
| DELETE | `/api/skills/:skillId/user/:userId` | Удаление навыка у пользователя |
| GET | `/api/skills/user/:userId/focus` | Получение фокусных навыков пользователя |
| POST | `/api/skills/:skillId/user/:userId/focus` | Добавление навыка в фокусные |
| DELETE | `/api/skills/:skillId/user/:userId/focus` | Удаление навыка из фокусных |
| POST | `/api/skills/:skillId/tasks` | Добавление задачи к навыку |
| DELETE | `/api/skills/user/:userId/all` | Удаление всех навыков пользователя |
| DELETE | `/api/skills/user/:userId/focus/all` | Удаление всех фокусных навыков пользователя |

### Задачи (Tasks)

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| GET | `/api/tasks` | Получение списка всех задач (опционально с фильтром по skillId) |
| GET | `/api/tasks/user/:userId` | Получение задач пользователя (опционально с фильтром по skillId) |
| POST | `/api/tasks` | Создание новой задачи |
| PATCH | `/api/tasks/:id/user/:userId` | Обновление статуса задачи у пользователя |
| DELETE | `/api/tasks/:id` | Удаление задачи |
| DELETE | `/api/tasks/user/:userId/all` | Удаление всех задач пользователя |

## Логика работы

1. **Пользователь начинает с пустыми данными**
   - Нет роадмапов, навыков и задач

2. **Добавление роадмапа**
   - Пользователь добавляет роадмап
   - Все задачи из этого роадмапа автоматически добавляются в его список задач

3. **Выполнение задач**
   - Задачи привязаны к навыкам
   - При выполнении задачи (completed = true) пользователь автоматически получает связанный навык
   - Прогресс навыка рассчитывается как процент выполненных задач

4. **Прогресс роадмапа**
   - Прогресс роадмапа рассчитывается как процент выполненных задач в этом роадмапе

5. **Фокусные навыки**
   - Пользователь может добавить навык в список фокусных, если прогресс по нему >= 50%

## Запуск приложения

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run start:dev

# Сборка проекта
npm run build

# Запуск в production режиме
npm run start:prod
```
