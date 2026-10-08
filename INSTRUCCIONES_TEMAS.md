# Modo claro, oscuro y automático

Solo se modificó el frontend. No requiere cambios en Next.js, Prisma ni variables de entorno.

## Uso

En la app, entra a **Perfil → Apariencia** y elige **Claro**, **Oscuro** o **Auto** (usa el tema del teléfono). La elección se guarda localmente con AsyncStorage y se aplica a Inicio, cuentas, estadísticas, perfil, navegación y pantallas con estilos `dark:` de NativeWind.

## Ejecutar en Windows

```powershell
cd frontend
npm ci
npx tsc --noEmit
npx expo start -c
```

Si ya tienes otro proyecto abierto, conserva allí tu `.env` original. No se incluyen credenciales reales. No necesitas instalar paquetes nuevos: AsyncStorage, NativeWind y `@expo-google-fonts/manrope` ya están en `package.json`.

## Archivos cambiados

- `context/ThemeContext.tsx` (nuevo): preferencia persistente, automático y sincronización NativeWind.
- `components/useColorScheme.ts` y `.web.ts`: leen el tema seleccionado.
- `app/_layout.tsx`: provider global, StatusBar, tipografías Manrope 200–800.
- `app/(tabs)/_layout.tsx`: barra inferior adaptativa.
- `app/(tabs)/profile.tsx`: selector de tema.
- `app/(tabs)/index.tsx`: paleta clara/oscura para la vista Inicio.
- `tailwind.config.js`: selector manual de modo oscuro y siete pesos de Manrope.

**Nota:** Las demás pantallas ya utilizaban clases `dark:`. Se mantienen sus formularios y llamadas API.
