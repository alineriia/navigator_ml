CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL UNIQUE, icon TEXT NOT NULL DEFAULT '✨',
  sort_order INTEGER NOT NULL DEFAULT 0, is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', telegram_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0, is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS branches_category_order_idx ON branches(category_id, sort_order);

INSERT INTO categories(name,icon,sort_order) VALUES
 ('Творчість та роботи','🎨',1),('Корисне для малювальників','📚',2),('Активності та розіграші','🎲',3),('Спілкування','💬',4),('Барахолка','🛍️',5)
ON CONFLICT (name) DO NOTHING;
WITH starter(category_name, branch_name, description, position) AS (VALUES
 ('Творчість та роботи','Процес малювання','Ділимося творчим процесом і поточними роботами.',1),
 ('Творчість та роботи','Ваші роботи (палітри)','Показуйте готові роботи та палітри.',2),
 ('Творчість та роботи','Завершені книги','Завершені розмальовки та альбоми.',3),
 ('Творчість та роботи','Розмальовки-мандрівниці','Гілка для мандрівних розмальовок.',4),
 ('Корисне для малювальників','Гайд по хобі','Базова інформація та відповіді для спільноти.',1),
 ('Корисне для малювальників','Арт-кухня для новачків','Підказки та матеріали для тих, хто починає.',2),
 ('Корисне для малювальників','Корисне','Поради, посилання та інші корисні матеріали.',3),
 ('Корисне для малювальників','Палітри','Ідеї та добірки кольорових палітр.',4),
 ('Корисне для малювальників','Огляди на розмальовки','Враження та огляди книжок.',5),
 ('Корисне для малювальників','Майбутні розмальовки від Hachette і не тільки','Анонси майбутніх видань.',6),
 ('Корисне для малювальників','Новинки на China-ринку','Новинки та знахідки китайського ринку.',7),
 ('Активності та розіграші','Анонси активностей','Оголошення про події та активності.',1),
 ('Активності та розіграші','Активні челенджі','Поточні творчі челенджі.',2),
 ('Активності та розіграші','Лотерея','Інформація про лотереї та розіграші.',3),
 ('Спілкування','Поговорити','Вільне спілкування учасників.',1),
 ('Спілкування','Книжковий клуб «Магії ліній»','Обговорюємо книжки та читацькі враження.',2),
 ('Спілкування','Кінострічка','Фільми, серіали та рекомендації.',3),
 ('Спілкування','Їжа / рецепти','Улюблені страви та рецепти.',4),
 ('Барахолка','Барахолка','Купівля, продаж та обмін.',1)
)
INSERT INTO branches(category_id,name,description,sort_order)
SELECT c.id,s.branch_name,s.description,s.position FROM starter s JOIN categories c ON c.name=s.category_name
WHERE NOT EXISTS (SELECT 1 FROM branches b WHERE b.category_id=c.id AND b.name=s.branch_name);
