import { Theme } from '../theme/Theme';
import { tr } from '../i18n/Strings';
import { SiteButton } from './SiteButton';

@Component
export struct EmptyState {
  @StorageLink('natpLanguage') private language: string = 'zh';
  titleKey: string = 'soon';
  bodyKey: string = '';
  actionKey: string = '';
  onAction: () => void = () => {};

  build() {
    Column({ space: 18 }) {
      Row().width(32).height(2).backgroundColor(Theme.cyan)
      Text(tr(this.language, this.titleKey)).fontSize(24).fontWeight(900)
        .fontColor(Theme.text).textAlign(TextAlign.Center)
      if (this.bodyKey.length > 0) {
        Text(tr(this.language, this.bodyKey)).fontSize(13).fontColor(Theme.muted)
          .textAlign(TextAlign.Center).lineHeight(22)
      }
      if (this.actionKey.length > 0) {
        SiteButton({ label: tr(this.language, this.actionKey), onAction: this.onAction })
      }
    }.width('100%').padding(28)
  }
}
