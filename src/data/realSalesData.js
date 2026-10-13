// DADOS REAIS DE VENDAS E CLIENTES - RESTAURAÇÃO ABSOLUTA DA OPERAÇÃO
// Sábado (10/10/2026) e Domingo (11/10/2026) - Total 12 Pedidos | R$ 490,50 Faturados

export const REAL_SALES_ORDERS = [
  {
    "id": "1005",
    "discount": 0,
    "neighborhood": "Alto Floresta",
    "phone": "38998247685",
    "deliveryFee": 0,
    "paymentMethod": "Pix",
    "address": "Rua Oiti, nº261 , Bairro Alto Floresta - Montes Claros/MG",
    "type": "delivery",
    "distanceKm": null,
    "customerName": "Luana",
    "items": [
      {
        "name": "Prensado de Costela (Pão 3 Queijos | Catupiry Original)",
        "productId": 3,
        "quantity": 1,
        "notes": null,
        "price": 25
      },
      {
        "productId": 1,
        "quantity": 1,
        "price": 21,
        "name": "Prensadinho (Pão 3 Queijos | Catupiry Original | + Cheddar)",
        "notes": null
      },
      {
        "productId": 1,
        "quantity": 1,
        "notes": "Sem milho e uma salsicha só",
        "name": "Prensadinho (Pão 3 Queijos | Catupiry Original)",
        "price": 17.5
      },
      {
        "productId": 2,
        "price": 22,
        "name": "Prensado de Frango (Pão 3 Queijos | Catupiry Original)",
        "notes": null,
        "quantity": 1
      }
    ],
    "date": "2026-10-10T22:23:31.647Z",
    "deliveredAt": "2026-10-10T23:27:50.237Z",
    "couponCode": null,
    "shippedAt": "2026-10-10T23:17:22.615Z",
    "status": "delivered",
    "total": 85.5,
    "changeFor": null,
    "updatedAt": "2026-10-10T23:27:50.237Z"
  },
  {
    "id": "1006",
    "customerName": "Sarah Nobre",
    "phone": "94991655727",
    "deliveryFee": 5,
    "date": "2026-10-10T23:47:02.868Z",
    "total": 27,
    "couponCode": null,
    "discount": 0,
    "type": "delivery",
    "paymentMethod": "Cartão de Débito",
    "items": [
      {
        "productId": 4,
        "notes": null,
        "name": "Prensado Pernil (Pão Queijo Parmesão | Cream Cheese | + Vinagrete)",
        "price": 22,
        "quantity": 1
      }
    ],
    "neighborhood": "Montes Claros",
    "deliveredAt": "2026-10-11T00:45:40.730Z",
    "shippedAt": "2026-10-11T00:14:46.707Z",
    "distanceKm": null,
    "status": "delivered",
    "address": "Rua Vinicius de Moraes 274 Planalto",
    "updatedAt": "2026-10-11T00:45:40.730Z",
    "changeFor": null
  },
  {
    "id": "1007",
    "items": [
      {
        "name": "Prensado de Costela (Pão 3 Queijos | Catupiry Original)",
        "price": 25,
        "quantity": 1,
        "productId": 3,
        "notes": "Não colocar a batata"
      },
      {
        "notes": "Retirar batata",
        "productId": 2,
        "name": "Prensado de Frango (Pão 3 Queijos | Catupiry Original)",
        "quantity": 1,
        "price": 22
      }
    ],
    "status": "delivered",
    "address": "Rua Senador Teotônio Vilela, nº 80, Bairro Vila Regina - Montes Claros/MG",
    "deliveryFee": 5,
    "type": "delivery",
    "neighborhood": "Vila Regina",
    "discount": 0,
    "total": 52,
    "paymentMethod": "Cartão de Crédito",
    "couponCode": null,
    "deliveredAt": "2026-10-11T01:12:15.829Z",
    "shippedAt": "2026-10-11T00:45:35.487Z",
    "updatedAt": "2026-10-11T01:12:15.828Z",
    "changeFor": null,
    "distanceKm": null,
    "customerName": "Alex Nobre",
    "phone": "38999665200",
    "date": "2026-10-11T00:17:30.967Z"
  },
  {
    "id": "1008",
    "total": 35,
    "type": "pickup",
    "couponCode": null,
    "changeFor": null,
    "updatedAt": "2026-10-11T23:27:21.495Z",
    "deliveryFee": 0,
    "items": [
      {
        "productId": 1,
        "notes": null,
        "name": "Prensadinho (Pão 3 Queijos | Cream Cheese | + Vinagrete)",
        "quantity": 2,
        "price": 17.5
      }
    ],
    "shippedAt": "2026-10-11T22:24:03.885Z",
    "status": "delivered",
    "customerName": "Simões",
    "distanceKm": null,
    "paymentMethod": "Cartão de Débito",
    "discount": 0,
    "neighborhood": null,
    "address": "Retirada no Balcão",
    "phone": "38988377330",
    "deliveredAt": "2026-10-11T23:27:21.495Z",
    "date": "2026-10-11T21:59:31.374Z"
  },
  {
    "id": "1009",
    "phone": "38997417810",
    "deliveredAt": "2026-10-11T23:27:20.443Z",
    "couponCode": null,
    "shippedAt": "2026-10-11T22:57:05.264Z",
    "type": "delivery",
    "distanceKm": null,
    "paymentMethod": "Pix",
    "changeFor": null,
    "updatedAt": "2026-10-11T23:27:20.443Z",
    "status": "delivered",
    "customerName": "Marcílio",
    "deliveryFee": 5,
    "date": "2026-10-11T22:26:09.291Z",
    "total": 36.5,
    "neighborhood": "Morrinhos",
    "items": [
      {
        "name": "Coca-Cola Zero Lata 350ml",
        "price": 6.5,
        "quantity": 1,
        "productId": 10,
        "notes": null
      },
      {
        "price": 25,
        "notes": null,
        "quantity": 1,
        "name": "Prensado de Costela (Pão Queijo Parmesão | Catupiry Original)",
        "productId": 3
      }
    ],
    "discount": 0,
    "address": "Rua Paraíba, nº , Bairro Morrinhos - Montes Claros/MG"
  },
  {
    "id": "1010",
    "deliveryFee": 5,
    "neighborhood": "Residencial Parque Sul",
    "paymentMethod": "Pix",
    "total": 22.5,
    "type": "delivery",
    "distanceKm": null,
    "items": [
      {
        "notes": null,
        "productId": 1,
        "quantity": 1,
        "name": "Prensadinho (Pão 3 Queijos | Catupiry Original)",
        "price": 17.5
      }
    ],
    "status": "delivered",
    "couponCode": null,
    "discount": 0,
    "deliveredAt": "2026-10-11T23:27:19.538Z",
    "address": "Rua J, nº 225, Bairro Residencial Parque Sul - Montes Claros/MG",
    "phone": "38991963555",
    "changeFor": null,
    "updatedAt": "2026-10-11T23:27:19.538Z",
    "customerName": "Moisés ferreira",
    "date": "2026-10-11T22:39:08.992Z",
    "shippedAt": "2026-10-11T22:57:03.718Z"
  },
  {
    "id": "1011",
    "deliveryFee": 0,
    "date": "2026-10-11T22:53:08.408Z",
    "items": [
      {
        "quantity": 2,
        "name": "Prensado de Costela (Pão 3 Queijos | Cream Cheese)",
        "notes": null,
        "productId": 3,
        "price": 25
      }
    ],
    "discount": 0,
    "paymentMethod": "Pix",
    "neighborhood": null,
    "address": "Retirada no Balcão",
    "total": 50,
    "couponCode": null,
    "deliveredAt": "2026-10-11T23:44:05.715Z",
    "customerName": "Luiz Matheus Ribeiro",
    "distanceKm": null,
    "status": "delivered",
    "shippedAt": "2026-10-11T23:39:55.084Z",
    "phone": "38991218119",
    "type": "pickup",
    "changeFor": null,
    "updatedAt": "2026-10-11T23:44:05.715Z"
  },
  {
    "id": "1012",
    "status": "delivered",
    "type": "pickup",
    "items": [
      {
        "quantity": 1,
        "price": 22,
        "name": "Prensado Pernil (Pão 3 Queijos | Catupiry Original)",
        "notes": null,
        "productId": 4
      },
      {
        "name": "Prensado de Frango (Pão 3 Queijos | Catupiry Original)",
        "price": 22,
        "quantity": 1,
        "productId": 2,
        "notes": null
      }
    ],
    "discount": 0,
    "neighborhood": null,
    "total": 44,
    "changeFor": "Não ",
    "updatedAt": "2026-10-11T23:53:08.830Z",
    "deliveryFee": 0,
    "shippedAt": "2026-10-11T23:53:07.450Z",
    "distanceKm": null,
    "paymentMethod": "Dinheiro (Troco p/ R$ Não )",
    "address": "Retirada no Balcão",
    "date": "2026-10-11T23:20:31.378Z",
    "phone": "38999254524",
    "customerName": "Mateus de Assis",
    "couponCode": null,
    "deliveredAt": "2026-10-11T23:53:08.830Z"
  },
  {
    "id": "1013",
    "phone": "38988198231",
    "deliveryFee": 0,
    "type": "pickup",
    "updatedAt": "2026-10-12T01:04:51.965Z",
    "changeFor": null,
    "paymentMethod": "Cartão de Débito",
    "address": "Retirada no Balcão",
    "customerName": "Marcos Ferreira Ramos",
    "shippedAt": "2026-10-12T00:42:50.366Z",
    "total": 58.5,
    "neighborhood": null,
    "deliveredAt": "2026-10-12T01:04:51.965Z",
    "distanceKm": null,
    "items": [
      {
        "name": "Prensado de Costela (Pão 3 Queijos | Catupiry Original)",
        "notes": null,
        "quantity": 2,
        "price": 25,
        "productId": 3
      },
      {
        "name": "Mate Couro 1 Litro",
        "quantity": 1,
        "notes": null,
        "price": 8.5,
        "productId": 7
      }
    ],
    "status": "delivered",
    "date": "2026-10-12T00:23:16.256Z",
    "discount": 0,
    "couponCode": null
  },
  {
    "id": "1014",
    "date": "2026-10-12T00:27:22.472Z",
    "deliveredAt": "2026-10-12T01:12:23.287Z",
    "neighborhood": "Vila Greice",
    "discount": 0,
    "phone": "38984156171",
    "distanceKm": null,
    "address": "Rua Carolina Quintino, nº 58 , Bairro Vila Greice - Montes Claros/MG",
    "paymentMethod": "Pix",
    "deliveryFee": 5,
    "status": "delivered",
    "items": [
      {
        "notes": null,
        "quantity": 1,
        "price": 17.5,
        "productId": 1,
        "name": "Prensadinho (Pão 3 Queijos | Cream Cheese | + Vinagrete)"
      },
      {
        "price": 17.5,
        "quantity": 1,
        "notes": null,
        "name": "Prensadinho (Pão Queijo Parmesão | Cream Cheese)",
        "productId": 1
      }
    ],
    "couponCode": null,
    "type": "delivery",
    "updatedAt": "2026-10-12T01:12:23.287Z",
    "changeFor": null,
    "total": 40,
    "shippedAt": "2026-10-12T01:04:48.290Z",
    "customerName": "Maria Clara Souza Lima"
  },
  {
    "id": "1015",
    "total": 22,
    "type": "pickup",
    "customerName": "Luiz Matheus Ribeiro",
    "status": "delivered",
    "deliveryFee": 0,
    "items": [
      {
        "price": 22,
        "productId": 4,
        "name": "Prensado Pernil (Pão 3 Queijos | Catupiry Original)",
        "quantity": 1,
        "notes": null
      }
    ],
    "address": "Retirada no Balcão",
    "discount": 0,
    "changeFor": null,
    "updatedAt": "2026-10-12T01:05:09.648Z",
    "phone": "38991218119",
    "distanceKm": null,
    "shippedAt": "2026-10-12T01:05:06.899Z",
    "paymentMethod": "Pix",
    "neighborhood": null,
    "date": "2026-10-12T00:31:02.342Z",
    "deliveredAt": "2026-10-12T01:05:09.648Z",
    "couponCode": null
  },
  {
    "id": "1016",
    "updatedAt": "2026-10-12T01:08:16.358Z",
    "changeFor": null,
    "neighborhood": null,
    "date": "2026-10-11T23:18:00.000Z",
    "distanceKm": null,
    "shippedAt": "2026-10-11T23:35:00.000Z",
    "total": 17.5,
    "deliveredAt": "2026-10-11T23:45:00.000Z",
    "discount": 0,
    "couponCode": null,
    "items": [
      {
        "price": 17.5,
        "name": "Prensadinho (Pão 3 Queijos | Catupiry Original)",
        "notes": null,
        "quantity": 1,
        "productId": 1
      }
    ],
    "phone": "38999254524",
    "address": "Retirada no Balcão",
    "type": "pickup",
    "customerName": "Mateus Assis",
    "paymentMethod": "Pix",
    "deliveryFee": 0,
    "status": "delivered"
  },
  {
    "id": "1017",
    "customerName": "Luiz caldeira",
    "phone": "38998771056",
    "type": "delivery",
    "address": "Rua Vinícius de Morais, nº 274, Bairro Planalto - Montes Claros/MG (Planalto)",
    "neighborhood": "Planalto",
    "distanceKm": null,
    "paymentMethod": "Pix (Mercado Pago)",
    "paymentStatus": "paid",
    "paymentProvider": "mercadopago",
    "paidAt": "2026-10-13T22:16:00.000Z",
    "changeFor": null,
    "items": [
      {
        "productId": 3,
        "name": "Prensado de Costela (Pão tradicional | Catupiry Original | + Vinagrete)",
        "price": 28,
        "quantity": 1,
        "notes": "Manda uma salsicha a parte. Quero só uma no pão"
      }
    ],
    "deliveryFee": 5.00,
    "discount": 0,
    "couponCode": null,
    "total": 33.00,
    "status": "pending",
    "date": "2026-10-13T22:16:00.000Z",
    "createdAt": "2026-10-13T22:16:00.000Z",
    "updatedAt": "2026-10-13T22:16:00.000Z"
  }
];

export const REAL_CUSTOMERS = [
  {
    "phone": "38998247685",
    "name": "Luana",
    "address": "Rua Oiti, nº261 , Bairro Alto Floresta - Montes Claros/MG",
    "neighborhood": "Alto Floresta",
    "stampsCount": 1,
    "totalOrders": 1,
    "lastOrderDate": "2026-10-10T22:23:31.647Z",
    "createdAt": "2026-10-10T22:23:31.647Z"
  },
  {
    "phone": "94991655727",
    "name": "Sarah Nobre",
    "address": "Rua Vinicius de Moraes 274 Planalto",
    "neighborhood": "Montes Claros",
    "stampsCount": 1,
    "totalOrders": 1,
    "lastOrderDate": "2026-10-10T23:47:02.868Z",
    "createdAt": "2026-10-10T23:47:02.868Z"
  },
  {
    "phone": "38999665200",
    "name": "Alex Nobre",
    "address": "Rua Senador Teotônio Vilela, nº 80, Bairro Vila Regina - Montes Claros/MG",
    "neighborhood": "Vila Regina",
    "stampsCount": 1,
    "totalOrders": 1,
    "lastOrderDate": "2026-10-11T00:17:30.967Z",
    "createdAt": "2026-10-11T00:17:30.967Z"
  },
  {
    "phone": "38988377330",
    "name": "Simões",
    "address": "Retirada no Balcão",
    "neighborhood": "",
    "stampsCount": 1,
    "totalOrders": 1,
    "lastOrderDate": "2026-10-11T21:59:31.374Z",
    "createdAt": "2026-10-11T21:59:31.374Z"
  },
  {
    "phone": "38997417810",
    "name": "Marcílio",
    "address": "Rua Paraíba, nº , Bairro Morrinhos - Montes Claros/MG",
    "neighborhood": "Morrinhos",
    "stampsCount": 1,
    "totalOrders": 1,
    "lastOrderDate": "2026-10-11T22:26:09.291Z",
    "createdAt": "2026-10-11T22:26:09.291Z"
  },
  {
    "phone": "38991963555",
    "name": "Moisés ferreira",
    "address": "Rua J, nº 225, Bairro Residencial Parque Sul - Montes Claros/MG",
    "neighborhood": "Residencial Parque Sul",
    "stampsCount": 1,
    "totalOrders": 1,
    "lastOrderDate": "2026-10-11T22:39:08.992Z",
    "createdAt": "2026-10-11T22:39:08.992Z"
  },
  {
    "phone": "38991218119",
    "name": "Luiz Matheus Ribeiro",
    "address": "Retirada no Balcão",
    "neighborhood": "",
    "stampsCount": 2,
    "totalOrders": 2,
    "lastOrderDate": "2026-10-12T00:31:02.342Z",
    "createdAt": "2026-10-11T22:53:08.408Z"
  },
  {
    "phone": "38999254524",
    "name": "Mateus de Assis",
    "address": "Retirada no Balcão",
    "neighborhood": "",
    "stampsCount": 2,
    "totalOrders": 2,
    "lastOrderDate": "2026-10-11T23:18:00.000Z",
    "createdAt": "2026-10-11T23:20:31.378Z"
  },
  {
    "phone": "38988198231",
    "name": "Marcos Ferreira Ramos",
    "address": "Retirada no Balcão",
    "neighborhood": "",
    "stampsCount": 1,
    "totalOrders": 1,
    "lastOrderDate": "2026-10-12T00:23:16.256Z",
    "createdAt": "2026-10-12T00:23:16.256Z"
  },
  {
    "phone": "38984156171",
    "name": "Maria Clara Souza Lima",
    "address": "Rua Carolina Quintino, nº 58 , Bairro Vila Greice - Montes Claros/MG",
    "neighborhood": "Vila Greice",
    "stampsCount": 1,
    "totalOrders": 1,
    "lastOrderDate": "2026-10-12T00:27:22.472Z",
    "createdAt": "2026-10-12T00:27:22.472Z"
  },
  {
    "phone": "38998771056",
    "name": "Luiz caldeira",
    "address": "Rua Vinícius de Morais, nº 274, Bairro Planalto - Montes Claros/MG (Planalto)",
    "neighborhood": "Planalto",
    "stampsCount": 1,
    "totalOrders": 1,
    "lastOrderDate": "2026-10-13T22:16:00.000Z",
    "createdAt": "2026-10-13T22:16:00.000Z"
  }
];

export const REAL_TRANSACTIONS = [
  {
    "id": "t-order-1005",
    "orderId": "1005",
    "date": "2026-10-10T23:27:50.237Z",
    "type": "income",
    "category": "Vendas",
    "value": 85.5,
    "description": "Pedido #1005 - Luana (Pix)"
  },
  {
    "id": "t-order-1006",
    "orderId": "1006",
    "date": "2026-10-11T00:45:40.730Z",
    "type": "income",
    "category": "Vendas",
    "value": 27,
    "description": "Pedido #1006 - Sarah Nobre (Cartão de Débito)"
  },
  {
    "id": "t-order-1007",
    "orderId": "1007",
    "date": "2026-10-11T01:12:15.829Z",
    "type": "income",
    "category": "Vendas",
    "value": 52,
    "description": "Pedido #1007 - Alex Nobre (Cartão de Crédito)"
  },
  {
    "id": "t-order-1008",
    "orderId": "1008",
    "date": "2026-10-11T23:27:21.495Z",
    "type": "income",
    "category": "Vendas",
    "value": 35,
    "description": "Pedido #1008 - Simões (Cartão de Débito)"
  },
  {
    "id": "t-order-1009",
    "orderId": "1009",
    "date": "2026-10-11T23:27:20.443Z",
    "type": "income",
    "category": "Vendas",
    "value": 36.5,
    "description": "Pedido #1009 - Marcílio (Pix)"
  },
  {
    "id": "t-order-1010",
    "orderId": "1010",
    "date": "2026-10-11T23:27:19.538Z",
    "type": "income",
    "category": "Vendas",
    "value": 22.5,
    "description": "Pedido #1010 - Moisés ferreira (Pix)"
  },
  {
    "id": "t-order-1011",
    "orderId": "1011",
    "date": "2026-10-11T23:44:05.715Z",
    "type": "income",
    "category": "Vendas",
    "value": 50,
    "description": "Pedido #1011 - Luiz Matheus Ribeiro (Pix)"
  },
  {
    "id": "t-order-1012",
    "orderId": "1012",
    "date": "2026-10-11T23:53:08.830Z",
    "type": "income",
    "category": "Vendas",
    "value": 44,
    "description": "Pedido #1012 - Mateus de Assis (Dinheiro (Troco p/ R$ Não ))"
  },
  {
    "id": "t-order-1013",
    "orderId": "1013",
    "date": "2026-10-12T01:04:51.965Z",
    "type": "income",
    "category": "Vendas",
    "value": 58.5,
    "description": "Pedido #1013 - Marcos Ferreira Ramos (Cartão de Débito)"
  },
  {
    "id": "t-order-1014",
    "orderId": "1014",
    "date": "2026-10-12T01:12:23.287Z",
    "type": "income",
    "category": "Vendas",
    "value": 40,
    "description": "Pedido #1014 - Maria Clara Souza Lima (Pix)"
  },
  {
    "id": "t-order-1015",
    "orderId": "1015",
    "date": "2026-10-12T01:05:09.648Z",
    "type": "income",
    "category": "Vendas",
    "value": 22,
    "description": "Pedido #1015 - Luiz Matheus Ribeiro (Pix)"
  },
  {
    "id": "t-order-1016",
    "orderId": "1016",
    "date": "2026-10-11T23:45:00.000Z",
    "type": "income",
    "category": "Vendas",
    "value": 17.5,
    "description": "Pedido #1016 - Mateus Assis (Pix)"
  },
  {
    "id": "t-order-1017",
    "orderId": "1017",
    "date": "2026-10-13T22:16:00.000Z",
    "type": "income",
    "category": "Vendas",
    "value": 33.0,
    "description": "Pedido #1017 - Luiz caldeira (Pix - Mercado Pago)"
  }
];
