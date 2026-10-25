IAM
├── users
├── type_users (nuevo sirve para identificar si es un tipo de usuario customer o owner)
├── roles
├── permissions
├── role_permissions

-- ----------------------------------------------------------------------------------------------------

Organizations
├── restaurants --- un usuario de tipo owner puede tener de uno a más restaurantes
├── dining_tables -- un restaurante tiene de una a más mesas --- el qrCode estara en una columan de esta tavla
├── employees -- un restaurante tiene uno a más empleados 
├── menus -- un restaurante tiene de uno a más menus ---
├── categories --- la categoria puede ser tanto para restaurantes como el menu es decir tipos de menu exceptera incluso productos
├── products
├── kitchen_supplies

Attention
├── orders
├── order_items
└── order_status_history

- orders es la cuenta total del pedido por lo que tiene una relacion de 1 a muchos con order_items
- order_items es el pedido de uno de los clientes por lo que se debe tener una relacion de uno a muchos con productos, se puede tener una fk del user pero es opcional
- order_status_history tiene una relacion de uno a muchos con orders ya que asi se ve el estado del plato
