import { Product } from '../model/Product';
import { Theme } from '../theme/Theme';
import { tr } from '../i18n/Strings';

@Component
export struct ProductCard {
  @StorageLink('natpLanguage') private language: string = 'zh';
  product: Product | undefined = undefined;
  @Prop favorite: boolean = false;
  onOpen: (id: string) => void = () => {};
  onFavorite: (id: string) => void = () => {};

  build() {
    Column({ space: 12 }) {
      Stack({ alignContent: Alignment.TopEnd }) {
        if (this.product) {
          Image(this.product.image).width('100%').aspectRatio(0.86).objectFit(ImageFit.Cover)
            .onClick(() => { if (this.product) { this.onOpen(this.product.id); } })
          Button({ type: ButtonType.Normal }) {
            Image(this.favorite ? $r('app.media.icon_heart_cyan') : $r('app.media.icon_heart_gray'))
              .width(20).height(20)
          }
          .width(44).height(44).backgroundColor(Theme.secondaryFill).borderRadius(0)
          .accessibilityText(tr(this.language, this.favorite ? 'unfavorite' : 'favorite'))
          .onClick(() => { if (this.product) { this.onFavorite(this.product.id); } })
        } else {
          Column().width('100%').aspectRatio(0.86).backgroundColor(Theme.panel)
            .accessibilityText(tr(this.language, 'emptySlot'))
        }
      }.width('100%')
      if (this.product) {
        if (this.product.isLimited || this.product.isNew) {
          Text(tr(this.language, this.product.isLimited ? 'limited' : 'new'))
            .fontSize(10).fontColor(Theme.cyan).fontWeight(900)
        }
        Text(this.language === 'en' && this.product.englishName.length > 0 ? this.product.englishName : this.product.name)
          .fontSize(14).fontColor(Theme.text).maxLines(2)
          .onClick(() => { if (this.product) { this.onOpen(this.product.id); } })
        Text(this.product.price > 0 ? '¥' + this.product.price.toFixed(2) : tr(this.language, 'pricePending'))
          .fontSize(16).fontWeight(900).fontColor(this.product.price > 0 ? Theme.text : Theme.cyan)
      } else {
        Row().width('82%').height(10).backgroundColor('#252B34')
        Row().width('35%').height(10).backgroundColor('#1B2129')
      }
    }
    .width('100%').alignItems(HorizontalAlign.Start).padding(10)
    .backgroundColor(Theme.surface).border({ width: 1, color: Theme.line })
  }
}
