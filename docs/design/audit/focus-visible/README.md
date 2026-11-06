# Видимый фокус: до и после

Снято на `/longjing`: страница открыта, нажат Tab до первого видимого
элемента — поля поиска. Desktop 1440 и mobile 390, светлая и тёмная тема.

| | Светлая | Тёмная |
|---|---|---|
| **До**, desktop | `before-desktop-light.png` | `before-desktop-dark.png` |
| **После**, desktop | `after-desktop-light.png` | `after-desktop-dark.png` |
| **До**, mobile | `before-mobile-light.png` | `before-mobile-dark.png` |
| **После**, mobile | `after-mobile-light.png` | `after-mobile-dark.png` |

На кадрах «до» фокус на поле есть, но на экране его не видно ничем: куда
именно уехал Tab, пользователь клавиатуры узнать не может. На кадрах «после»
вокруг поля кольцо.

При работе мышью кадр не меняется: кольцо рисуется только для
`:focus-visible`.
