import { Theme } from '../theme/Theme';
import { tr } from '../i18n/Strings';

@Component
export struct NATPHeader {
  @StorageLink('natpLanguage') private language: string = 'zh';
  @Prop titleKey: string = 'store';
  @Prop eyebrow: string = 'NATP / OFFICIAL MERCH';

  build() {
    Column({ space: 10 }) {
      Text(this.eyebrow).fontSize(10).fontWeight(900).letterSpacing(1.6).fontColor(Theme.cyan)
      Text(tr(this.language, this.titleKey)).fontSize(30).fontWeight(900).fontColor(Theme.text)
    }
    .width('100%').alignItems(HorizontalAlign.Start).padding({ left: 20, right: 20, top: 24, bottom: 18 })
  }
}
