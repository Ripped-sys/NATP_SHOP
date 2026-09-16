import { Theme } from '../theme/Theme';

@Component
export struct SiteButton {
  @Prop label: string = '';
  @Prop kind: string = 'primary';
  @Prop available: boolean = true;
  @Prop buttonHeight: number = 48;
  onAction: () => void = () => {};

  build() {
    Button({ type: ButtonType.Normal, stateEffect: true }) {
      Text(this.label)
        .fontSize(13)
        .fontWeight(900)
        .letterSpacing(0.6)
        .fontColor(this.kind === 'danger' ? Theme.danger : Theme.text)
        .textAlign(TextAlign.Center)
        .maxLines(2)
    }
    .width('100%')
    .height(this.buttonHeight)
    .padding({ left: 14, right: 14 })
    .borderRadius(0)
    .backgroundColor(this.kind === 'primary' ? Theme.primaryFill : Theme.secondaryFill)
    .border({ width: 1, color: this.kind === 'primary' ? Theme.primaryBorder : Theme.secondaryBorder })
    .shadow({ radius: this.kind === 'primary' ? 12 : 0, color: '#1839B2EC', offsetX: 0, offsetY: 0 })
    .enabled(this.available)
    .opacity(this.available ? 1 : 0.4)
    .onClick(this.onAction)
  }
}
