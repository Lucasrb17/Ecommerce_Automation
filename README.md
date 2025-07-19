## 📡 API Tests (Postman)

Este repositorio también incluye una colección de tests automatizados de la API de [AutomationExercise.com](https://automationexercise.com/api_list), ubicada en la carpeta `/postman`.

Los tests están organizados por grupos:

- **Products**: lista de productos, búsqueda, marcas
- **Auth**: login con y sin parámetros
- **User Management**: creación y eliminación de usuarios dinámicos

### ▶️ Ejecutar los tests desde consola

1. Instalar Newman (si no lo tenés):
```bash
npm install -g newman
```

2. Ejecutar la colección:
```bash
npm run api-tests
```

Esto correrá todos los tests incluidos en:
```
postman/automationexercise_full_suite_collection.json
```

También podés ejecutar directamente:
```bash
newman run postman/automationexercise_full_suite_collection.json
```