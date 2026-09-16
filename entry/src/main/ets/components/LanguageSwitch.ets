import { Theme } from '../theme/Theme';

@Component
export struct LanguageSwitch {
  @StorageLink('natpLanguage') private language: string = 'zh';

  build() {
    Row({ space: 0 }) {
      Button('中文', { type: ButtonType.Normal })
        .width(46).height(40).padding(0).borderRadius(0).fontSize(12).fontWeight(FontWeight.Bold)
        .fontColor(this.language === 'zh' ? Theme.cyan : Theme.muted)
        .backgroundColor(this.language === 'zh' ? Theme.primaryFill : Color.Transparent)
        .accessibilityText('切换中文')
        .onClick(() => { this.language = 'zh'; })
      Button('EN', { type: ButtonType.Normal })
        .width(42).height(40).padding(0).borderRadius(0).fontSize(12).fontWeight(FontWeight.Bold)
        .fontColor(this.language === 'en' ? Theme.cyan : Theme.muted)
        .backgroundColor(this.language === 'en' ? Theme.primaryFill : Color.Transparent)
        .accessibilityText('Switch to English')
        .onClick(() => { this.language = 'en'; })
    }.border({ width: 1, color: Theme.line })
  }
}
