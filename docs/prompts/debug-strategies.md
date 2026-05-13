# Debug Strategies

## Z-Order / Stacking Order Debug

### Activation

Depuis la console navigateur :
```js
enableZOrderDebug()   // activer
disableZOrderDebug()  // désactiver
```

Ou en localStorage avant chargement :
```js
localStorage.setItem("debug_zorder", "1")
```

### Logs produits

| Préfixe | Événement |
|---|---|
| `[zOrder] bringToTop("X")` | Appel de bringToTop — index source et destination |
| `[zOrder] initZOrder([N ids])` | Réinitialisation — nb IDs conservés / nouveaux |
| `[zOrder] insertAfter(...)` | Insertion après un ID — position dans l'array |
| `[zOrder] [STORE] [...] → [...]` | Changement détecté via subscriber — état avant/après |
| `[zOrder] zIndex:X apply N → clamped M` | Application du zIndex sur un nœud Konva |
| `[zOrder] CardRenderer[X] dragStart → moveToTop` | Drag démarré sur une carte |
| `[zOrder] DeckRenderer[X] dragStart → moveToTop` | Drag démarré sur un deck |
| `[zOrder] TableCanvas initZOrder [...]` | Appel initZOrder depuis TableCanvas |
| `[zOrder] TableCanvas handleDraw → insertAfter(...)` | Pioche — insertion zOrder |

### Protocole de debug stacking

1. **Activer les logs** avant de reproduire
2. **Console navigateur** ouverte (F12)
3. **Reproduire le geste** (drag d'une carte)
4. **Analyser la séquence** :
   - `bringToTop("X")` doit placer X en **fin** d'array
   - Les `zIndex:X apply` doivent s'appliquer dans l'ordre du zOrder (bas → haut)
   - Si `initZOrder` se déclenche **pendant** un drag → problème de dépendance effet
   - Un même ID ne doit jamais apparaître 2× dans le zOrder
   - `bringToTop("X") — unknown, append` → la carte manque dans le zOrder

## Règles générales de debug

1. **Instrumenter avant de spéculer** : logs structurés avec préfixe `[module]` avant toute analyse
2. **Tracer état avant/après** : pour tout changement d'état, logger l'ancien et le nouveau
3. **Vérifier les invariants** : pas de doublons, pas d'IDs manquants, pas d'appels concurrents
4. **Utiliser les outils navigateur** : Konva Inspector, React DevTools