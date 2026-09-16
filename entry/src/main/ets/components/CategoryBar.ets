import { Theme } from '../theme/Theme';
import { tr } from '../i18n/Strings';

@Component
export struct CategoryBar {
  @StorageLink('natpLanguage') private language: string = 'zh';
  categories: string[] = [];
  @Prop selected: string = 'ALL';
  onSelect: (value: string) => void = () => {};
  build() {
    List({ space: 8 }) {
      ForEach(this.categories, (name: string) => {
        ListItem() {
          Button(tr(this.language, name), { type: ButtonType.Normal })
            .height(44).padding({ left: 14, right: 14 }).borderRadius(0)
            .fontSize(11).fontWeight(900)
            .fontColor(this.selected === name ? Theme.cyan : Theme.muted)
            .border({ width: 1, color: this.selected === name ? Theme.primaryBorder : Theme.line })
            .backgroundColor(this.selected === name ? Theme.primaryFill : Theme.surface)
            .onClick(() => { this.onSelect(name); })
        }
      }, (name: string) => name)
    }
    .listDirection(Axis.Horizontal).height(48).scrollBar(BarState.Off)
    .padding({ left: 20, right: 20 })
  }
}
