IAM
├── users
├── roles
├── permissions
├── role_permissions

En este dominio aplicaremos las siguientes relaciones
- un user debe tener un solo rol por lo que hay una relacion de 1 a 1 entre user a roles
- un rol puede tener uno o más permisos y a la ves un permiso puede estar relacionado a más de un rol por lo que la la tablas rol_permision esta correcta

por el momento esas son todas las tablas que tendremos como primera fase

-- ----------------------------------------------------------------------------------------------------

Organizations
├── organizations 
├── restaurants
├── restaurant_locations [X]
├── dining_tables
├── table_qr_codes
├── employees
├── employee_locations [X]
├── menus
├── location_menus [X]
├── categories
├── menu_categories [X]
├── products
├── kitchen_supplies
├── category_products [X]
└── location_products [X]

En este dominio aplicaremos las siguientes relaciones
- organization puede tener uno o más restaurantes por lo que la relacion es de 1 a muchos
- organization_locations ya no es necesario creo por que esos datos pueden estar en la misma tabla de restaurants por lo que desaparece
- restaurants puede tener una a más mesas por lo que la relacion es de 1 a muchas con dining_tables
- table_qr_code tiene una relacion de 1 a 1 con dining_tables
- restaurants tiene una relacion de uno a muchos con employees 
- employee_locations no es necesario la localizacion puede salir del mismo restaurants y no es relevante asi que se va
- restaurants tiene una relacion de 1 a muchos con menus
- location_menus se va no es necesario puede obtenerse mediante una consulta a relacionandose con restaurants
- categories es una tabla global puede usarse para relacionarse con la muchas entidades es decir la ccategoria del restaurante o del menu se queda
- menu_categories esto se eliminara no es necesario puede estar perfectamente en categories
- products se mantiene y es un platillo o bebida o algun otra comida que ofrece el local
- se agrega la tabla kitchen_supplies, ya que describe mejor los insumos de cocina que necesita el restaurante

- category_products mismo caso puede estar perfectamente en la tabla de categories por lo que se removera esa tabla
- location_products tabla inncesaria por lo que se elimina

-- ----------------------------------------------------------------------------------------------------

Attention
├── orders
├── order_items
└── order_status_history

- orders es la cuenta total del pedido por lo que tiene una relacion de 1 a muchos con order_items
- order_items es el pedido de uno de los clientes por lo que se debe tener una relacion de uno a muchos con productos, se puede tener una fk del user pero es opcional
- order_status_history tiene una relacion de uno a muchos con orders ya que asi se ve el estado del plato
