import { Theme } from '../theme/Theme';
import { tr } from '../i18n/Strings';
import { SiteButton } from '../components/SiteButton';
import { StoreState } from '../model/StoreState';
import { NATPHeader } from '../components/NATPHeader';
import { CartItem } from '../model/Product';

@Component
export struct CheckoutPage {
  @StorageLink('natpLanguage') private language: string = 'zh';

  private t(key: string): string { return tr(this.language, key); }

  @ObjectLink store: StoreState;
  @State private noticeKey: string = '';
  onBack: () => void = () => {};
  onDone: () => void = () => {};
  onAddress: () => void = () => {};

  private productName(id: string): string {
    const product = this.store.findProduct(id);
    if (!product) { return this.t('itemUnavailable'); }
    return this.language === 'en' && product.englishName.length > 0 ? product.englishName : product.name;
  }

  build() {
    Column({ space: 16 }) {
      SiteButton({ label: this.t('backCart'), kind: 'secondary', buttonHeight: 44, onAction: this.onBack })
      NATPHeader({ titleKey: 'checkoutTitle', eyebrow: 'NATP / ORDER REVIEW' })
      Scroll() {
        Column({ space: 18 }) {
          Text(this.store.receiver.length > 0 ? this.store.receiver + ' / ' + this.store.phone : this.t('addressRequired'))
            .fontSize(15).fontColor(Theme.text)
          Text(this.store.address).fontSize(13).fontColor(Theme.muted)
          SiteButton({ label: this.t('editAddress'), kind: 'secondary', onAction: this.onAddress })
          ForEach(this.store.checkoutItems(), (item: CartItem) => {
            Column({ space: 8 }) {
              Text(this.productName(item.productId)).fontColor(Theme.text).fontSize(15)
              Text((item.size === '均码' ? this.t('oneSize') : item.size) + ' / ×' + item.quantity)
                .fontColor(Theme.muted).fontSize(13)
            }.width('100%').alignItems(HorizontalAlign.Start).padding(14)
              .backgroundColor(Theme.surface).border({ width: 1, color: Theme.line })
          }, (item: CartItem) => JSON.stringify([item.productId, item.size]))
          Text(this.t('quantity') + ' / ' + this.store.checkoutCount()).fontSize(14).fontColor(Theme.muted)
          Text(this.t('total') + '  ¥' + this.store.checkoutTotal().toFixed(2)).fontSize(26).fontWeight(900).fontColor(Theme.text)
          Text(this.t('demoNotice')).fontSize(13).fontColor(Theme.muted).lineHeight(22)
          if (this.noticeKey.length > 0) { Text(this.t(this.noticeKey)).fontSize(13).fontColor(Theme.danger) }
        }.width('100%').padding(20).alignItems(HorizontalAlign.Start)
      }.width('100%').layoutWeight(1).scrollBar(BarState.Off).align(Alignment.Top)
      SiteButton({ label: this.t('createOrder'), available: this.store.checkoutCount() > 0,
        onAction: () => {
          if (this.store.address.length === 0) { this.noticeKey = 'addressMissing'; return; }
          if (this.store.checkout()) {
            this.getUIContext().getPromptAction().showToast({ message: this.t('paymentSuccess') });
            this.onDone();
          } else { this.noticeKey = 'orderChanged'; }
        } }).width('90%').margin({ bottom: 20 })
    }.width('100%').height('100%').backgroundColor(Theme.background)
  }
}
