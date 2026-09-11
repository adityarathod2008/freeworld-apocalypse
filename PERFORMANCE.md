# FreeWorld Engine — Performance Budget & Dynamic Throttling Specification

## Target Framerate & Frame Budget
FreeWorld is engineered for high-frame-rate web performance across modern devices:

- **Target Framerate (Normal)**: **60 FPS**
- **Frame Budget Target**: **16.7 ms / frame**
- **Minimum Target (Stress Baseline)**: **$\ge$45 FPS** (~22.2 ms / frame)

---

## 3-Frame 22ms Dynamic Performance Throttling System
If the engine detects frame render times exceeding **22 ms** (~45 FPS drop) for **3 consecutive frames**, `PerformanceManager` automatically engages dynamic quality throttling to prevent frame stutters.

```
                  [Frame Time > 22ms?]
                      /          \
                    YES           NO
                    /              \
         [Spike Count++]       [Spike Count = 0]
                |              [Normal Count++]
      [Spike Count >= 3?]           |
          /        \         [Normal Count >= 10?]
        YES         NO           /         \
        /            \         YES          NO
[Increase Throttle]  [Wait]  [Decrease]   [Maintain]
```

### Throttling Levels

| Throttle Level | Trigger Condition | Automated Quality Adjustments |
|---|---|---|
| **Level 0 (Normal)** | Frame time $\le$ 18.0 ms | Full visual quality, 2K shadow maps, max particle density, 60Hz AI updates. |
| **Level 1 (Light)** | 3 consecutive frames > 22.0 ms | Reduces shadow map refresh rate, caps particle emission rates by 30%. |
| **Level 2 (Medium)** | Further 3 consecutive frames > 22.0 ms | Demotes distant AI simulation LOD to 30Hz/15Hz update intervals, caps active particle emitters. |
| **Level 3 (Heavy)** | Further 3 consecutive frames > 22.0 ms | Caps audio voice channels, demotes all non-visible entity animations to FAR/UNLOADED tier. |

### Recovery Pipeline
When frame render times stabilize below **18.0 ms** for **10 consecutive frames**, the engine automatically steps down the throttle level, restoring full visual quality without disrupting gameplay logic.
