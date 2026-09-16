import { Theme } from '../theme/Theme';
import { tr } from '../i18n/Strings';
import { SiteButton } from '../components/SiteButton';

@Component
export struct LoginPage {
  @StorageLink('natpLanguage') private language: string = 'zh';

  private t(key: string): string { return tr(this.language, key); }

  @State private account: string = '';
  @State private password: string = '';
  @State private errorKey: string = '';
  onLoginSuccess: (username: string) => void = () => {};
  onJoinNATP: () => void = () => {};

  private login(): void {
    if (this.account.trim().length === 0) { this.errorKey = 'accountRequired'; return; }
    if (this.password.length < 6 || this.password.trim().length === 0) { this.errorKey = 'passwordInvalid'; return; }
    this.errorKey = '';
    this.onLoginSuccess(this.account.trim());
  }

  build() {
    Stack() {
      Image($r('app.media.natp_live_portrait')).width('100%').height('100%').objectFit(ImageFit.Cover).grayscale(0.4)
      Column().width('100%').height('100%').backgroundColor('#C205060A')
      Scroll() {
        Column({ space: 18 }) {
          Image($r('app.media.natp_logo')).width(132).height(108).objectFit(ImageFit.Contain)
          Text('NATP / OFFICIAL STORE').fontSize(10).fontWeight(900).letterSpacing(1.5).fontColor(Theme.cyan)
          Text(this.t('welcomeNoise')).fontSize(28).fontWeight(900).fontColor(Theme.text)
          Column({ space: 16 }) {
            Text(this.t('memberLogin')).fontSize(11).fontWeight(900).letterSpacing(1).fontColor(Theme.muted)
            TextInput({ placeholder: this.t('accountPlaceholder'), text: this.account })
              .height(52).fontSize(15).fontColor(Theme.text).placeholderColor(Theme.muted)
              .backgroundColor('#D90B0D13').border({ width: 1, color: Theme.line }).borderRadius(0)
              .padding({ left: 14, right: 14 })
              .onChange((value: string) => { this.account = value; this.errorKey = ''; })
            TextInput({ placeholder: this.t('password'), text: this.password })
              .type(InputType.Password).height(52).fontSize(15).fontColor(Theme.text).placeholderColor(Theme.muted)
              .backgroundColor('#D90B0D13').border({ width: 1, color: Theme.line }).borderRadius(0)
              .padding({ left: 14, right: 14 })
              .onChange((value: string) => { this.password = value; this.errorKey = ''; })
            if (this.errorKey.length > 0) {
              Text(this.t(this.errorKey)).fontSize(12).lineHeight(19).fontColor(Theme.danger)
            }
            SiteButton({ label: this.t('login'), onAction: () => { this.login(); } })
            SiteButton({ label: this.t('joinLink'), kind: 'secondary', onAction: this.onJoinNATP })
          }.width('100%').alignItems(HorizontalAlign.Start).padding(20)
            .backgroundColor('#C902070B').border({ width: 1, color: '#4D7BCDEF' })
          Text(this.t('loginFooter')).fontSize(11).fontColor(Theme.muted).lineHeight(18)
          Text('XI’AN, CHINA / NATP').fontSize(10).letterSpacing(1.5).fontColor(Theme.dim).margin({ top: 10 })
        }.width('100%').alignItems(HorizontalAlign.Start)
          .padding({ left: 24, right: 24, top: 28, bottom: 30 })
      }.width('100%').height('100%').scrollBar(BarState.Off).align(Alignment.Top)
    }.width('100%').height('100%').backgroundColor(Theme.background)
  }
}
