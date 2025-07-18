# 📊 Ecommerce Automation with Playwright

Este proyecto contiene pruebas automatizadas end-to-end utilizando [Playwright](https://playwright.dev/) para el sitio web [https://automationexercise.com/](https://automationexercise.com/).

El objetivo es validar funcionalidades clave como login, registro, navegación de productos, agregado al carrito, compra y logout, tanto desde la interfaz gráfica como mediante llamadas a la API.

---

## 📁 Estructura del Proyecto

```
ecommerce/
├── tests/           # Tests organizados por flujo (login, carrito, compra)
├── pages/           # Page Objects que representan cada sección del sitio
├── utils/           # Datos de prueba y helpers como generación de emails o llamadas a API
├── playwright.config.ts  # Configuración de Playwright
├── package.json
├── README.md
```

---

## ✨ Comenzar

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/ecommerce.git
cd ecommerce
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Instalar navegadores

```bash
npx playwright install
```

---

## ▶️ Comandos útiles

### Ejecutar todos los tests

```bash
npx playwright test
```

### Ejecutar en modo visual (no headless)

```bash
npx playwright test --headed
```

### Ver el reporte de test

```bash
npx playwright show-report
```

---

## 🧹 Funcionalidades cubiertas

### ✅ UI Tests

* Login con usuario válido
* Login fallido con usuario inválido
* Registro de nuevo usuario (próximamente)
* Agregado de productos al carrito (logueado y no logueado)
* Proceso completo de compra
* Logout

### ✅ API Tests

* Verificación de login vía API con credenciales válidas
* Validación de error al omitir parámetros en `verifyLogin`

---

## 🛠 Herramientas

* [Playwright](https://playwright.dev/)
* TypeScript
* Page Object Model (POM)
* Test runners por defecto de Playwright

---


## 🧠 Autor

Proyecto de automatización QA desarrollado por Lucas Romero.

---

## 📜 Licencia

Este repositorio es solo para uso educativo y de práctica. No tiene fines comerciales ni está asociado oficialmente a automationexercise.com.

