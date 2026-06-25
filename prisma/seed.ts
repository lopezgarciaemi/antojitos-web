/**
 * Script de Seed para poblar la base de datos con datos de prueba
 * FASE 1: Incluye Ingredientes, Recetas y datos completos
 * 
 * Ejecutar con: npm run db:seed
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...\n');

  // ============================================
  // 1. USUARIOS
  // ============================================
  console.log('👥 Creando usuarios...');
  
  const adminPassword = await hashPassword('admin123');
  const clientePassword = await hashPassword('cliente123');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@antojitos.com' },
    update: {},
    create: {
      email: 'admin@antojitos.com',
      name: 'Administrador',
      password: adminPassword,
      role: 'ADMIN',
      phone: '5512345678',
    },
  });

  const cliente = await prisma.user.upsert({
    where: { email: 'cliente@test.com' },
    update: {},
    create: {
      email: 'cliente@test.com',
      name: 'Cliente de Prueba',
      password: clientePassword,
      role: 'CLIENTE',
      phone: '5587654321',
    },
  });

  const cocina = await prisma.user.upsert({
    where: { email: 'cocina@antojitos.com' },
    update: {},
    create: {
      email: 'cocina@antojitos.com',
      name: 'Personal de Cocina',
      password: await hashPassword('cocina123'),
      role: 'COCINA',
    },
  });

  console.log(`✅ Usuarios creados: ${admin.email}, ${cliente.email}, ${cocina.email}\n`);

  // ============================================
  // 2. INGREDIENTES (INVENTARIO)
  // ============================================
  console.log('🥩 Creando ingredientes...');

  const ingredientes = await Promise.all([
    prisma.ingredient.upsert({
      where: { name: 'Tortilla de Maíz' },
      update: {},
      create: {
        name: 'Tortilla de Maíz',
        unit: 'PIEZA',
        stock: 500,
        minStock: 100,
        cost: 1.5,
      },
    }),
    prisma.ingredient.upsert({
      where: { name: 'Tortilla de Harina' },
      update: {},
      create: {
        name: 'Tortilla de Harina',
        unit: 'PIEZA',
        stock: 200,
        minStock: 50,
        cost: 3,
      },
    }),
    prisma.ingredient.upsert({
      where: { name: 'Carne al Pastor' },
      update: {},
      create: {
        name: 'Carne al Pastor',
        unit: 'KG',
        stock: 15,
        minStock: 3,
        cost: 180,
      },
    }),
    prisma.ingredient.upsert({
      where: { name: 'Carne de Bistec' },
      update: {},
      create: {
        name: 'Carne de Bistec',
        unit: 'KG',
        stock: 10,
        minStock: 2,
        cost: 220,
      },
    }),
    prisma.ingredient.upsert({
      where: { name: 'Carnitas' },
      update: {},
      create: {
        name: 'Carnitas',
        unit: 'KG',
        stock: 8,
        minStock: 2,
        cost: 200,
      },
    }),
    prisma.ingredient.upsert({
      where: { name: 'Queso Oaxaca' },
      update: {},
      create: {
        name: 'Queso Oaxaca',
        unit: 'KG',
        stock: 5,
        minStock: 1,
        cost: 150,
      },
    }),
    prisma.ingredient.upsert({
      where: { name: 'Hongos' },
      update: {},
      create: {
        name: 'Hongos',
        unit: 'KG',
        stock: 3,
        minStock: 0.5,
        cost: 80,
      },
    }),
    prisma.ingredient.upsert({
      where: { name: 'Flor de Calabaza' },
      update: {},
      create: {
        name: 'Flor de Calabaza',
        unit: 'KG',
        stock: 2,
        minStock: 0.5,
        cost: 120,
      },
    }),
    prisma.ingredient.upsert({
      where: { name: 'Frijoles Refritos' },
      update: {},
      create: {
        name: 'Frijoles Refritos',
        unit: 'KG',
        stock: 10,
        minStock: 2,
        cost: 40,
      },
    }),
    prisma.ingredient.upsert({
      where: { name: 'Pollo Desebrado' },
      update: {},
      create: {
        name: 'Pollo Desebrado',
        unit: 'KG',
        stock: 8,
        minStock: 2,
        cost: 120,
      },
    }),
    prisma.ingredient.upsert({
      where: { name: 'Chicharrón Prensado' },
      update: {},
      create: {
        name: 'Chicharrón Prensado',
        unit: 'KG',
        stock: 4,
        minStock: 1,
        cost: 180,
      },
    }),
    prisma.ingredient.upsert({
      where: { name: 'Agua de Jamaica' },
      update: {},
      create: {
        name: 'Agua de Jamaica',
        unit: 'LT',
        stock: 20,
        minStock: 5,
        cost: 15,
      },
    }),
    prisma.ingredient.upsert({
      where: { name: 'Agua de Horchata' },
      update: {},
      create: {
        name: 'Agua de Horchata',
        unit: 'LT',
        stock: 20,
        minStock: 5,
        cost: 18,
      },
    }),
    prisma.ingredient.upsert({
      where: { name: 'Refresco Lata' },
      update: {},
      create: {
        name: 'Refresco Lata',
        unit: 'PIEZA',
        stock: 48,
        minStock: 12,
        cost: 12,
      },
    }),
  ]);

  console.log(`✅ ${ingredientes.length} ingredientes creados\n`);

  // ============================================
  // 3. CATEGORÍAS
  // ============================================
  console.log('📁 Creando categorías...');

  const categorias = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Tacos' },
      update: {},
      create: {
        name: 'Tacos',
        description: 'Tacos al pastor, de carnitas, bistec y más',
        imageUrl: '🌮',
        order: 1,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Quesadillas' },
      update: {},
      create: {
        name: 'Quesadillas',
        description: 'Quesadillas de queso, hongos, flor de calabaza',
        imageUrl: '🫓',
        order: 2,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Sopes' },
      update: {},
      create: {
        name: 'Sopes',
        description: 'Sopes de frijol con diferentes guisos',
        imageUrl: '🥘',
        order: 3,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Gorditas' },
      update: {},
      create: {
        name: 'Gorditas',
        description: 'Gorditas rellenas de chicharrón, frijol, queso',
        imageUrl: '🌯',
        order: 4,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Bebidas' },
      update: {},
      create: {
        name: 'Bebidas',
        description: 'Aguas frescas, refrescos y más',
        imageUrl: '🥤',
        order: 5,
      },
    }),
  ]);

  console.log(`✅ ${categorias.length} categorías creadas\n`);

  // ============================================
  // 4. PRODUCTOS
  // ============================================
  console.log('🌮 Creando productos...');

  const catTacos = categorias.find(c => c.name === 'Tacos')!;
  const catQuesadillas = categorias.find(c => c.name === 'Quesadillas')!;
  const catSopes = categorias.find(c => c.name === 'Sopes')!;
  const catGorditas = categorias.find(c => c.name === 'Gorditas')!;
  const catBebidas = categorias.find(c => c.name === 'Bebidas')!;

  // Primero limpiamos productos existentes para evitar duplicados
  await prisma.recipe.deleteMany({});
  await prisma.productOptionGroup.deleteMany({});
  await prisma.product.deleteMany({});

  const productos = await Promise.all([
    // TACOS
    prisma.product.create({
      data: {
        name: 'Taco al Pastor',
        description: 'Taco de carne al pastor con piña',
        basePrice: 15,
        imageUrl: 'taco-al-pastor.png',
        categoryId: catTacos.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Taco de Bistec',
        description: 'Taco de bistec asado',
        basePrice: 18,
        imageUrl: 'taco_de_bistec.png',
        categoryId: catTacos.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Taco de Carnitas',
        description: 'Taco de carnitas de cerdo',
        basePrice: 16,
        imageUrl: 'taco_de_carnitas.png',
        categoryId: catTacos.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Taco de Barbacoa',
        description: 'Taco de barbacoa de res',
        basePrice: 18,
        imageUrl: 'taco_barbacoa.png',
        categoryId: catTacos.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Taco de Pollo',
        description: 'Taco de pollo asado',
        basePrice: 15,
        imageUrl: 'taco_de_pollo.png',
        categoryId: catTacos.id,
      },
    }),

    // QUESADILLAS
    prisma.product.create({
      data: {
        name: 'Quesadilla Sencilla',
        description: 'Quesadilla con queso Oaxaca',
        basePrice: 25,
        imageUrl: 'quesadilla-sencilla.png',
        categoryId: catQuesadillas.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Quesadilla con Carne',
        description: 'Quesadilla con carne asada',
        basePrice: 35,
        imageUrl: 'quesadilla-con-carne.png',
        categoryId: catQuesadillas.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Huarache con Carne',
        description: 'Huarache con carne asada',
        basePrice: 40,
        imageUrl: 'huarache-con-carne.png',
        categoryId: catQuesadillas.id,
      },
    }),

    // SOPES
    prisma.product.create({
      data: {
        name: 'Sope de Frijol',
        description: 'Sope con frijoles refritos',
        basePrice: 22,
        imageUrl: 'sope-de-frijol.png',
        categoryId: catSopes.id,
      },
    }),

    // GORDITAS Y TORTAS
    prisma.product.create({
      data: {
        name: 'Gordita de Chicharrón',
        description: 'Gordita rellena de chicharrón prensado',
        basePrice: 24,
        imageUrl: 'gordita-de-chicharron.png',
        categoryId: catGorditas.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Torta de Jamón',
        description: 'Torta con jamón, queso y aguacate',
        basePrice: 45,
        imageUrl: 'torta_de_jamon.png',
        categoryId: catGorditas.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Torta de Milanesa',
        description: 'Torta con milanesa de res empanizada',
        basePrice: 55,
        imageUrl: 'torta_de_milanesa.png',
        categoryId: catGorditas.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Burrito de Res',
        description: 'Burrito con carne de res y frijoles',
        basePrice: 50,
        imageUrl: 'burrito-de-res.png',
        categoryId: catGorditas.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Burrito Vegetariano',
        description: 'Burrito con frijoles y verduras',
        basePrice: 45,
        imageUrl: 'burrito-vegetariano.png',
        categoryId: catGorditas.id,
      },
    }),

    // BEBIDAS
    prisma.product.create({
      data: {
        name: 'Agua de Jamaica',
        description: 'Agua fresca de jamaica',
        basePrice: 20,
        imageUrl: 'agua-de-jamaica.png',
        categoryId: catBebidas.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Agua de Horchata',
        description: 'Agua fresca de horchata',
        basePrice: 20,
        imageUrl: 'agua-de-horchata.png',
        categoryId: catBebidas.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Coca Cola',
        description: 'Refresco Coca-Cola',
        basePrice: 25,
        imageUrl: 'coca-cola.png',
        categoryId: catBebidas.id,
      },
    }),
  ]);

  console.log(`✅ ${productos.length} productos creados\n`);

  // ============================================
  // 5. RECETAS (BOM - Bill of Materials)
  // ============================================
  console.log('📋 Creando recetas (ingredientes por producto)...');

  // Obtener ingredientes por nombre
  const tortillaMaiz = ingredientes.find(i => i.name === 'Tortilla de Maíz')!;
  const carnePastor = ingredientes.find(i => i.name === 'Carne al Pastor')!;
  const carneBistec = ingredientes.find(i => i.name === 'Carne de Bistec')!;
  const carnitas = ingredientes.find(i => i.name === 'Carnitas')!;
  const quesoOaxaca = ingredientes.find(i => i.name === 'Queso Oaxaca')!;
  const hongos = ingredientes.find(i => i.name === 'Hongos')!;
  const florCalabaza = ingredientes.find(i => i.name === 'Flor de Calabaza')!;
  const frijoles = ingredientes.find(i => i.name === 'Frijoles Refritos')!;
  const pollo = ingredientes.find(i => i.name === 'Pollo Desebrado')!;
  const chicharron = ingredientes.find(i => i.name === 'Chicharrón Prensado')!;
  const aguaJamaica = ingredientes.find(i => i.name === 'Agua de Jamaica')!;
  const aguaHorchata = ingredientes.find(i => i.name === 'Agua de Horchata')!;
  const refrescoLata = ingredientes.find(i => i.name === 'Refresco Lata')!;

  // Obtener productos por nombre
  const tacoPastor = productos.find(p => p.name === 'Taco al Pastor')!;
  const tacoBistec = productos.find(p => p.name === 'Taco de Bistec')!;
  const tacoCarnitas = productos.find(p => p.name === 'Taco de Carnitas')!;
  const tacoBarbacoa = productos.find(p => p.name === 'Taco de Barbacoa')!;
  const tacoPollo = productos.find(p => p.name === 'Taco de Pollo')!;
  const quesaSencilla = productos.find(p => p.name === 'Quesadilla Sencilla')!;
  const quesaCarne = productos.find(p => p.name === 'Quesadilla con Carne')!;
  const huarache = productos.find(p => p.name === 'Huarache con Carne')!;
  const sopeFrijol = productos.find(p => p.name === 'Sope de Frijol')!;
  const gorditaChicharron = productos.find(p => p.name === 'Gordita de Chicharrón')!;
  const tortaJamon = productos.find(p => p.name === 'Torta de Jamón')!;
  const tortaMilanesa = productos.find(p => p.name === 'Torta de Milanesa')!;
  const burritoRes = productos.find(p => p.name === 'Burrito de Res')!;
  const burritoVeg = productos.find(p => p.name === 'Burrito Vegetariano')!;
  const bebidaJamaica = productos.find(p => p.name === 'Agua de Jamaica')!;
  const bebidaHorchata = productos.find(p => p.name === 'Agua de Horchata')!;
  const bebidaCoca = productos.find(p => p.name === 'Coca Cola')!;

  const recetas = await Promise.all([
    // Taco al Pastor: 1 tortilla + 0.05 kg carne
    prisma.recipe.create({
      data: { productId: tacoPastor.id, ingredientId: tortillaMaiz.id, quantity: 1 },
    }),
    prisma.recipe.create({
      data: { productId: tacoPastor.id, ingredientId: carnePastor.id, quantity: 0.05 },
    }),

    // Taco de Bistec: 1 tortilla + 0.06 kg bistec
    prisma.recipe.create({
      data: { productId: tacoBistec.id, ingredientId: tortillaMaiz.id, quantity: 1 },
    }),
    prisma.recipe.create({
      data: { productId: tacoBistec.id, ingredientId: carneBistec.id, quantity: 0.06 },
    }),

    // Taco de Carnitas: 1 tortilla + 0.05 kg carnitas
    prisma.recipe.create({
      data: { productId: tacoCarnitas.id, ingredientId: tortillaMaiz.id, quantity: 1 },
    }),
    prisma.recipe.create({
      data: { productId: tacoCarnitas.id, ingredientId: carnitas.id, quantity: 0.05 },
    }),

    // Taco de Barbacoa: 1 tortilla + 0.05 kg carne
    prisma.recipe.create({
      data: { productId: tacoBarbacoa.id, ingredientId: tortillaMaiz.id, quantity: 1 },
    }),

    // Taco de Pollo: 1 tortilla + 0.05 kg pollo
    prisma.recipe.create({
      data: { productId: tacoPollo.id, ingredientId: tortillaMaiz.id, quantity: 1 },
    }),
    prisma.recipe.create({
      data: { productId: tacoPollo.id, ingredientId: pollo.id, quantity: 0.05 },
    }),

    // Quesadilla Sencilla: 2 tortillas + 0.08 kg queso
    prisma.recipe.create({
      data: { productId: quesaSencilla.id, ingredientId: tortillaMaiz.id, quantity: 2 },
    }),
    prisma.recipe.create({
      data: { productId: quesaSencilla.id, ingredientId: quesoOaxaca.id, quantity: 0.08 },
    }),

    // Quesadilla con Carne: 2 tortillas + 0.06 kg queso + 0.08 kg carne
    prisma.recipe.create({
      data: { productId: quesaCarne.id, ingredientId: tortillaMaiz.id, quantity: 2 },
    }),
    prisma.recipe.create({
      data: { productId: quesaCarne.id, ingredientId: quesoOaxaca.id, quantity: 0.06 },
    }),
    prisma.recipe.create({
      data: { productId: quesaCarne.id, ingredientId: carneBistec.id, quantity: 0.08 },
    }),

    // Huarache con Carne: 1 tortilla + 0.05 kg frijoles + 0.08 kg carne
    prisma.recipe.create({
      data: { productId: huarache.id, ingredientId: tortillaMaiz.id, quantity: 1 },
    }),
    prisma.recipe.create({
      data: { productId: huarache.id, ingredientId: frijoles.id, quantity: 0.05 },
    }),
    prisma.recipe.create({
      data: { productId: huarache.id, ingredientId: carneBistec.id, quantity: 0.08 },
    }),

    // Sope de Frijol: 1 tortilla + 0.05 kg frijoles
    prisma.recipe.create({
      data: { productId: sopeFrijol.id, ingredientId: tortillaMaiz.id, quantity: 1 },
    }),
    prisma.recipe.create({
      data: { productId: sopeFrijol.id, ingredientId: frijoles.id, quantity: 0.05 },
    }),

    // Gordita de Chicharrón
    prisma.recipe.create({
      data: { productId: gorditaChicharron.id, ingredientId: tortillaMaiz.id, quantity: 2 },
    }),
    prisma.recipe.create({
      data: { productId: gorditaChicharron.id, ingredientId: chicharron.id, quantity: 0.06 },
    }),

    // Bebidas
    prisma.recipe.create({
      data: { productId: bebidaJamaica.id, ingredientId: aguaJamaica.id, quantity: 0.5 },
    }),
    prisma.recipe.create({
      data: { productId: bebidaHorchata.id, ingredientId: aguaHorchata.id, quantity: 0.5 },
    }),
    prisma.recipe.create({
      data: { productId: bebidaCoca.id, ingredientId: refrescoLata.id, quantity: 1 },
    }),
  ]);

  console.log(`✅ ${recetas.length} recetas creadas\n`);

  // ============================================
  // 6. GRUPOS DE OPCIONES
  // ============================================
  console.log('⚙️ Creando opciones de personalización...');

  // Limpiar opciones existentes
  await prisma.option.deleteMany({});
  await prisma.optionGroup.deleteMany({});

  // Grupo: Tipo de Tortilla
  const grupoTortilla = await prisma.optionGroup.create({
    data: {
      name: 'Tipo de Tortilla',
      isRequired: true,
      allowMultiple: false,
      order: 1,
    },
  });

  await Promise.all([
    prisma.option.create({
      data: {
        name: 'Tortilla de Maíz',
        priceModifier: 0,
        isDefault: true,
        optionGroupId: grupoTortilla.id,
        order: 1,
      },
    }),
    prisma.option.create({
      data: {
        name: 'Tortilla de Harina',
        priceModifier: 3,
        optionGroupId: grupoTortilla.id,
        order: 2,
      },
    }),
  ]);

  // Grupo: Salsas
  const grupoSalsas = await prisma.optionGroup.create({
    data: {
      name: 'Salsas',
      isRequired: false,
      allowMultiple: true,
      maxSelections: 3,
      order: 2,
    },
  });

  await Promise.all([
    prisma.option.create({
      data: {
        name: 'Salsa Verde',
        priceModifier: 0,
        optionGroupId: grupoSalsas.id,
        order: 1,
      },
    }),
    prisma.option.create({
      data: {
        name: 'Salsa Roja',
        priceModifier: 0,
        optionGroupId: grupoSalsas.id,
        order: 2,
      },
    }),
    prisma.option.create({
      data: {
        name: 'Salsa Habanera',
        priceModifier: 5,
        optionGroupId: grupoSalsas.id,
        order: 3,
      },
    }),
  ]);

  // Grupo: Extras
  const grupoExtras = await prisma.optionGroup.create({
    data: {
      name: 'Extras',
      isRequired: false,
      allowMultiple: true,
      order: 3,
    },
  });

  await Promise.all([
    prisma.option.create({
      data: {
        name: 'Cilantro',
        priceModifier: 0,
        optionGroupId: grupoExtras.id,
        order: 1,
      },
    }),
    prisma.option.create({
      data: {
        name: 'Cebolla',
        priceModifier: 0,
        optionGroupId: grupoExtras.id,
        order: 2,
      },
    }),
    prisma.option.create({
      data: {
        name: 'Queso Extra',
        priceModifier: 10,
        optionGroupId: grupoExtras.id,
        order: 3,
      },
    }),
    prisma.option.create({
      data: {
        name: 'Aguacate',
        priceModifier: 15,
        optionGroupId: grupoExtras.id,
        order: 4,
      },
    }),
  ]);

  console.log('✅ Grupos de opciones creados\n');

  // ============================================
  // 7. ASOCIAR OPCIONES CON PRODUCTOS
  // ============================================
  console.log('🔗 Asociando opciones con productos...');

  const productosTacos = productos.filter(p => p.name.includes('Taco'));
  const productosQuesadillas = productos.filter(p => p.name.includes('Quesadilla'));

  // Tacos: Tortilla, Salsas, Extras
  for (const producto of productosTacos) {
    await Promise.all([
      prisma.productOptionGroup.create({
        data: { productId: producto.id, optionGroupId: grupoTortilla.id },
      }),
      prisma.productOptionGroup.create({
        data: { productId: producto.id, optionGroupId: grupoSalsas.id },
      }),
      prisma.productOptionGroup.create({
        data: { productId: producto.id, optionGroupId: grupoExtras.id },
      }),
    ]);
  }

  // Quesadillas: solo Salsas y Extras
  for (const producto of productosQuesadillas) {
    await Promise.all([
      prisma.productOptionGroup.create({
        data: { productId: producto.id, optionGroupId: grupoSalsas.id },
      }),
      prisma.productOptionGroup.create({
        data: { productId: producto.id, optionGroupId: grupoExtras.id },
      }),
    ]);
  }

  console.log('✅ Opciones asociadas con productos\n');

  // ============================================
  // 8. DIRECCIÓN DE PRUEBA PARA CLIENTE
  // ============================================
  console.log('📍 Creando dirección de prueba...');

  await prisma.address.upsert({
    where: { id: 'direccion-cliente-default' },
    update: {},
    create: {
      id: 'direccion-cliente-default',
      userId: cliente.id,
      label: 'Casa',
      street: 'Av. Insurgentes Sur',
      number: '1234',
      intNumber: '5B',
      colony: 'Del Valle',
      city: 'CDMX',
      state: 'CDMX',
      zipCode: '03100',
      phone: '5587654321',
      references: 'Edificio azul, entre Eje 5 y Calle Dakota',
      isDefault: true,
    },
  });

  console.log('✅ Dirección de prueba creada\n');

  // ============================================
  // RESUMEN FINAL
  // ============================================
  console.log('═══════════════════════════════════════════');
  console.log('✨ Seed completado exitosamente!');
  console.log('═══════════════════════════════════════════\n');
  console.log('📊 Resumen:');
  console.log(`   👥 3 usuarios`);
  console.log(`   🥩 ${ingredientes.length} ingredientes`);
  console.log(`   📁 ${categorias.length} categorías`);
  console.log(`   🌮 ${productos.length} productos`);
  console.log(`   📋 ${recetas.length} recetas`);
  console.log(`   📍 1 dirección de prueba\n`);
  console.log('📝 Credenciales de prueba:');
  console.log('   Admin:   admin@antojitos.com / admin123');
  console.log('   Cliente: cliente@test.com / cliente123');
  console.log('   Cocina:  cocina@antojitos.com / cocina123\n');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
