import { PrismaClient } from '@prisma/client';

// Скрипт для миграции данных из поля _old_roadmapIds в таблицу связей _RoadmapToSkill
async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Начинаем миграцию данных...');
    
    // Получаем все скиллы с их _old_roadmapIds
    const skills = await prisma.$queryRaw<
      Array<{ skillId: string, old_roadmapIds: string[] }>
    >`SELECT "skillId", "_old_roadmapIds" as "old_roadmapIds" FROM "Skill" WHERE "_old_roadmapIds" IS NOT NULL`;
    
    console.log(`Найдено ${skills.length} навыков для миграции`);
    
    // Для каждого скилла добавляем связь с роадмапами
    let totalConnections = 0;
    
    for (const skill of skills) {
      if (!skill.old_roadmapIds || !Array.isArray(skill.old_roadmapIds) || skill.old_roadmapIds.length === 0) {
        console.log(`Скилл ${skill.skillId} не имеет roadmapIds, пропускаем`);
        continue;
      }
      
      console.log(`Обрабатываем скилл ${skill.skillId} с ${skill.old_roadmapIds.length} roadmapIds`);
      
      // Проверяем существование каждого роадмапа и создаем связь
      for (const roadmapId of skill.old_roadmapIds) {
        const roadmap = await prisma.roadmap.findUnique({ 
          where: { roadmapId }
        });
        
        if (!roadmap) {
          console.log(`Роадмап ${roadmapId} не найден, пропускаем`);
          continue;
        }
        
        try {
          // Добавляем связь через прямое обновление таблицы связей
          await prisma.$executeRaw`
            INSERT INTO "_RoadmapToSkill" ("A", "B") 
            VALUES (${roadmapId}, ${skill.skillId})
            ON CONFLICT DO NOTHING
          `;
          
          totalConnections++;
          console.log(`Добавлена связь между роадмапом ${roadmapId} и скиллом ${skill.skillId}`);
        } catch (error) {
          console.error(`Ошибка при добавлении связи для роадмапа ${roadmapId} и скилла ${skill.skillId}:`, error);
        }
      }
    }
    
    console.log(`Миграция завершена. Создано ${totalConnections} связей.`);
  } catch (error) {
    console.error('Ошибка при миграции данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => console.log('Миграция успешно завершена'))
  .catch((e) => {
    console.error('Ошибка выполнения скрипта:', e);
    process.exit(1);
  }); 