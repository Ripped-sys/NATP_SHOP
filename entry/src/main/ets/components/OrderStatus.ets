import { Theme } from '../theme/Theme';
import { tr } from '../i18n/Strings';

@Component
export struct OrderStatus {
  @StorageLink('natpLanguage') private language: string = 'zh';
  onSelect: (status: string) => void = () => {};
  private labels: string[] = ['待付款', '待发货', '待收货', '已完成'];
  build() {
    Row() {
      ForEach(this.labels, (name: string) => {
        Button({ type: ButtonType.Normal }) {
          Column({ space: 10 }) {
            Image($r('app.media.icon_box')).width(24).height(24)
            Text(tr(this.language, name)).fontSize(9).fontWeight(700).fontColor(Theme.muted)
          }
        }
        .layoutWeight(1).height(84).backgroundColor(Theme.panel).borderRadius(0)
        .onClick(() => { this.onSelect(name); })
      }, (name: string) => name)
    }.width('100%').border({ width: 1, color: Theme.line })
  }
}
