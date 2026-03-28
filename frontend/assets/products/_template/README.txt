ШАБЛОН ДОБАВЛЕНИЯ ТОВАРА

1. Создать папку товара:
   frontend/assets/products/slug-tovara/

2. Создать папку фото:
   frontend/assets/products/slug-tovara/gallery/

3. Положить 4 фото:
   1.jpg
   2.jpg
   3.jpg
   4.jpg

4. Скопировать product.json из _template
   и заменить:
   - id
   - slug
   - name
   - category
   - price
   - short_specs
   - description
   - photos
   - specs

5. Добавить краткую карточку товара в:
   frontend/data/products.json

6. Категории:
   divany-2  = диваны двухместные
   divany-3  = диваны трёхместные
   uglovye   = диваны угловые
   kresla    = кресла
   pufy      = пуфы
   krovati   = кровати

7. Цена:
   price = базовая цена 1 категории ткани

8. fabric_prices:
   хранит накопительную надбавку:
   1 = 0
   2 = 5600
   3 = 8200
   4 = 10800
   5 = 13400
   6 = 16000
   7 = 18600
   8 = 21200
   9 = 23800
   10 = 26400
   11 = 29000
   12 = 39600
