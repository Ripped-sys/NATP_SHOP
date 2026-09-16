import { Theme } from '../theme/Theme';
import { tr } from '../i18n/Strings';
import { SiteButton } from '../components/SiteButton';

@Component
export struct RegisterPage {
  @StorageLink('natpLanguage') private language: string = 'zh';

  private t(key: string): string { return tr(this.language, key); }

  @State private username: string = '';
  @State private phone: string = '';
  @State private password: string = '';
  @State private confirmPassword: string = '';
  @State private errorKey: string = '';
  onRegisterSuccess: (username: string) => void = () => {};
  onBackToLogin: () => void = () => {};

  private register(): void {
    const name: string = this.username.trim();
    if (name.length < 2 || name.length > 20) { this.errorKey = 'usernameInvalid'; return; }
    if (!/^1[3-9]\d{9}$/.test(this.phone)) { this.errorKey = 'phoneInvalid'; return; }
    if (this.password.length < 6 || this.password.trim().length === 0) { this.errorKey = 'passwordInvalid'; return; }
    if (this.password !== this.confirmPassword) { this.errorKey = 'passwordMismatch'; return; }
    this.errorKey = '';
    this.password = '';
    this.confirmPassword = '';
    this.onRegisterSuccess(name);
  }

  @Styles
  inputAppearance() {
    .width('100%').height(52).backgroundColor('#E00B0D13')
    .border({ width: 1, color: Theme.line }).borderRadius(0).padding({ left: 14, right: 14 })
  }

  build() {
    Stack() {
      Image($r('app.media.natp_live_portrait')).width('100%').height('100%').objectFit(ImageFit.Cover).grayscale(0.4)
      Column().width('100%').height('100%').backgroundColor('#DB05060A')
      Scroll() {
        Column({ space: 18 }) {
          Text('NATP / MEMBERSHIP').fontSize(10).fontWeight(900).letterSpacing(1.5).fontColor(Theme.cyan)
          Text(this.t('join')).fontSize(38).fontWeight(900).fontColor(Theme.text)
          Text(this.t('joinIntro')).fontSize(14).fontColor(Theme.muted)
          Column({ space: 14 }) {
            TextInput({ placeholder: this.t('usernamePlaceholder'), text: this.username })
              .inputAppearance().maxLength(20).fontSize(14).fontColor(Theme.text).placeholderColor(Theme.muted)
              .onChange((value: string) => { this.username = value; this.errorKey = ''; })
            TextInput({ placeholder: this.t('phonePlaceholder'), text: this.phone })
              .inputAppearance().type(InputType.PhoneNumber).maxLength(11)
              .fontSize(14).fontColor(Theme.text).placeholderColor(Theme.muted)
              .onChange((value: string) => { this.phone = value; this.errorKey = ''; })
            TextInput({ placeholder: this.t('passwordPlaceholder'), text: this.password })
              .inputAppearance().type(InputType.Password).fontSize(14).fontColor(Theme.text).placeholderColor(Theme.muted)
              .onChange((value: string) => { this.password = value; this.errorKey = ''; })
            TextInput({ placeholder: this.t('confirmPassword'), text: this.confirmPassword })
              .inputAppearance().type(InputType.Password).fontSize(14).fontColor(Theme.text).placeholderColor(Theme.muted)
              .onChange((value: string) => { this.confirmPassword = value; this.errorKey = ''; })
            if (this.errorKey.length > 0) {
              Text(this.t(this.errorKey)).fontSize(12).lineHeight(19).fontColor(Theme.danger)
            }
            SiteButton({ label: this.t('createAccount'), onAction: () => { this.register(); } })
          }.width('100%').padding(18).backgroundColor('#D602070B').border({ width: 1, color: '#4D7BCDEF' })
          SiteButton({ label: this.t('backLogin'), kind: 'secondary', onAction: this.onBackToLogin })
          Text('BREAK THROUGH THE WORLD').fontSize(10).letterSpacing(1).fontColor(Theme.dim)
        }.width('100%').alignItems(HorizontalAlign.Start).padding(24)
      }.width('100%').height('100%').scrollBar(BarState.Off).align(Alignment.Top)
    }.width('100%').height('100%').backgroundColor(Theme.background)
  }
}
