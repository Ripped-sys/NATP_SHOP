import { Theme } from '../theme/Theme';
import { tr } from '../i18n/Strings';
import { SiteButton } from '../components/SiteButton';
import { StoreState } from '../model/StoreState';
import { OrderStatus } from '../components/OrderStatus';

@Component
export struct ProfilePage {
  @StorageLink('natpLanguage') private language: string = 'zh';

  private t(key: string): string { return tr(this.language, key); }

  @ObjectLink store: StoreState;
  onOpen: (section: string) => void = () => {};
  onOrders: (status: string) => void = () => {};
  onLogout: () => void = () => {};
  private menus: string[] = ['MY ORDERS', 'SHIPPING ADDRESS', 'FAVORITES', 'ACCOUNT', 'ABOUT NATP', 'CONTACT'];

  build() {
    Scroll() {
      Column({ space: 22 }) {
        Text('03 / NATP COMMUNITY').fontSize(10).fontWeight(900).letterSpacing(1.5).fontColor(Theme.cyan)
        Row({ space: 18 }) {
          Image($r('app.media.natp_logo')).width(76).height(64).objectFit(ImageFit.Contain)
          Column({ space: 8 }) {
            Text(this.store.username).fontSize(25).fontWeight(900).fontColor(Theme.text)
            Text(this.t('member')).fontSize(11).fontWeight(900).fontColor(Theme.cyan)
          }.alignItems(HorizontalAlign.Start).layoutWeight(1)
        }.width('100%')
        Text(this.t('welcomeBack')).fontSize(13).fontColor(Theme.muted)
        OrderStatus({ onSelect: this.onOrders })
        Column() {
          ForEach(this.menus, (name: string, index: number) => {
            Button({ type: ButtonType.Normal }) {
              Row({ space: 14 }) {
                Text('0' + (index + 1)).fontColor(Theme.cyan).fontSize(11).fontWeight(900)
                Text(this.t(name)).fontColor(Theme.text).fontSize(14).fontWeight(700).layoutWeight(1)
                Text('→').fontColor(Theme.muted).fontSize(18)
              }.width('100%')
            }.width('100%').height(62).padding(16).backgroundColor(Theme.surface).borderRadius(0)
              .border({ width: { bottom: 1 }, color: Theme.line })
              .onClick(() => { this.onOpen(name); })
          }, (name: string) => name)
        }.width('100%').border({ width: 1, color: Theme.line })
        SiteButton({ label: this.t('logout'), kind: 'danger', onAction: this.onLogout })
        Text(this.language === 'en' ? 'NATP / BREAK THROUGH THE WORLD\nXI’AN, CHINA' : 'NATP / 内网穿透\n穿透全世界 · 中国西安')
          .fontColor(Theme.dim).fontSize(11).lineHeight(22).margin({ top: 8, bottom: 16 })
      }.padding(20).width('100%').alignItems(HorizontalAlign.Start)
    }.width('100%').height('100%').backgroundColor(Theme.background).scrollBar(BarState.Off).align(Alignment.Top)
  }
}
