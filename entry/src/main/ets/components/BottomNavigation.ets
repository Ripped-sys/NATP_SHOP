import { Theme } from '../theme/Theme';
import { tr } from '../i18n/Strings';

@Component
export struct BottomNavigation {
  @StorageLink('natpLanguage') private language: string = 'zh';
  @Prop selected: number = 0;
  @Prop count: number = 0;
  onSelect: (index: number) => void = () => {};
  private names: string[] = ['home', 'merch', 'cart', 'me'];
  private icons: Resource[] = [$r('app.media.icon_home_gray'), $r('app.media.icon_merch_gray'),
    $r('app.media.icon_cart_gray'), $r('app.media.icon_me_gray')];
  private activeIcons: Resource[] = [$r('app.media.icon_home_cyan'), $r('app.media.icon_merch_cyan'),
    $r('app.media.icon_cart_cyan'), $r('app.media.icon_me_cyan')];

  build() {
    Row() {
      ForEach(this.names, (name: string, index: number) => {
        Button({ type: ButtonType.Normal }) {
          Column({ space: 6 }) {
            Image(this.selected === index ? this.activeIcons[index] : this.icons[index]).width(22).height(22)
            Text(tr(this.language, name) + (index === 2 && this.count > 0 ? ' (' + this.count + ')' : ''))
              .fontSize(11).fontWeight(700).fontColor(this.selected === index ? Theme.cyan : Theme.muted)
          }
        }
        .layoutWeight(1).height(62).backgroundColor(Theme.surface).borderRadius(0)
        .border({ width: { top: this.selected === index ? 2 : 0 }, color: Theme.cyan })
        .accessibilityText(tr(this.language, name)).onClick(() => { this.onSelect(index); })
      }, (name: string) => name)
    }.width('100%').border({ width: { top: 1 }, color: Theme.line }).backgroundColor(Theme.surface)
  }
}
