import katex from "katex";
import "katex/dist/katex.min.css";
import "katex/contrib/mhchem";

type EquationProps = {
  math: string;
  label?: string;
  help?: string;
};

const alternateNotation: Record<string, string[]> = {
  [String.raw`E = hf = \frac{hc}{\lambda}`]: [String.raw`E=h\nu`, String.raw`E_\gamma=\frac{hc}{\lambda}`],
  [String.raw`K_{max} = hf - \phi`]: [String.raw`KE_{max}=h\nu-W`, String.raw`E_{k,max}=h\nu-\Phi`],
  [String.raw`V_s = \frac{K_{max}}{e}`]: [String.raw`eV_0=K_{max}`, String.raw`V_0=\frac{KE_{max}}{e}`],
  [String.raw`\lambda_0 = \frac{hc}{\phi_{eff}}`]: [String.raw`\lambda_{threshold}=\frac{hc}{W_{eff}}`],
  [String.raw`\Delta y = \frac{\lambda L}{d}`]: [String.raw`s=\frac{\lambda D}{a}`, String.raw`\Delta x=\frac{\lambda L}{d}`],
  [String.raw`I = I_0\cos^2(\beta)\operatorname{sinc}^2(\alpha)`]: [String.raw`I(\theta)=I_{max}\cos^2(\delta/2)\left(\frac{\sin\alpha}{\alpha}\right)^2`],
  [String.raw`\beta = \frac{\pi d\sin\theta}{\lambda}`]: [String.raw`\delta=\frac{2\pi d\sin\theta}{\lambda}`, String.raw`\beta=\frac{\delta}{2}`],
  [String.raw`SE = \frac{s}{\sqrt{n}}`]: [String.raw`SEM=\frac{s}{\sqrt{n}}`, String.raw`\sigma_{\bar{x}}=\frac{\sigma}{\sqrt{n}}`],
  [String.raw`t = \frac{\bar{x} - \mu_0}{SE}`]: [String.raw`t_{stat}=\frac{\bar{x}-\mu_0}{s/\sqrt{n}}`],
  [String.raw`CI = \bar{x} \pm t^* SE`]: [String.raw`\bar{x}\pm t_{\alpha/2,df}\frac{s}{\sqrt{n}}`],
  [String.raw`\vec{R}=\vec{A}+\vec{B}`]: [String.raw`\vec{R}_x=A_x+B_x`, String.raw`\vec{R}_y=A_y+B_y`],
  [String.raw`|\vec{R}|=\sqrt{R_x^2+R_y^2}`]: [String.raw`R=\sqrt{R_x^2+R_y^2}`],
  [String.raw`\hat{y}=b_0+b_1x`]: [String.raw`\hat{y}=\beta_0+\beta_1x`, String.raw`y=mx+c`],
  [String.raw`b_1=\frac{\sum(x_i-\bar{x})(y_i-\bar{y})}{\sum(x_i-\bar{x})^2}`]: [String.raw`b_1=\frac{\operatorname{Cov}(x,y)}{\operatorname{Var}(x)}`, String.raw`m=\frac{\sum dx\,dy}{\sum dx^2}`],
  [String.raw`R^2=1-\frac{SS_{res}}{SS_{tot}}`]: [String.raw`R^2=\frac{SS_{reg}}{SS_{tot}}`, String.raw`R^2=r^2\ \mathrm{(simple\ linear)}`],
  [String.raw`a^2+b^2=c^2`]: [String.raw`c^2=a^2+b^2`, String.raw`x^2+y^2=r^2`],
  [String.raw`c=\sqrt{a^2+b^2}`]: [String.raw`d=\sqrt{\Delta x^2+\Delta y^2}`, String.raw`|\vec{v}|=\sqrt{v_x^2+v_y^2}`],
  [String.raw`A_{\triangle}=\frac{1}{2}ab`]: [String.raw`\mathrm{Area}=\frac{1}{2}\mathrm{base}\cdot\mathrm{height}`],
  [String.raw`x=\cos\theta`]: [String.raw`\cos\theta=\frac{\mathrm{adjacent}}{\mathrm{hypotenuse}}`],
  [String.raw`y=\sin\theta`]: [String.raw`\sin\theta=\frac{\mathrm{opposite}}{\mathrm{hypotenuse}}`],
  [String.raw`\sin^2\theta+\cos^2\theta=1`]: [String.raw`\cos^2\theta+\sin^2\theta=1`, String.raw`x^2+y^2=1`],
  [String.raw`\tan\theta=\frac{\sin\theta}{\cos\theta}`]: [String.raw`\tan\theta=\frac{y}{x}`, String.raw`\tan\theta=\frac{\mathrm{opposite}}{\mathrm{adjacent}}`],
  [String.raw`P(X=k)=\binom{n}{k}p^k(1-p)^{n-k}`]: [String.raw`\Pr(X=k)={n \choose k}p^kq^{n-k}`, String.raw`q=1-p`],
  [String.raw`\mu=np`]: [String.raw`E[X]=np`],
  [String.raw`\sigma=\sqrt{np(1-p)}`]: [String.raw`\operatorname{Var}(X)=np(1-p)`, String.raw`\sigma=\sqrt{\operatorname{Var}(X)}`],
  [String.raw`y=y_0e^{kt}`]: [String.raw`N(t)=N_0e^{rt}`, String.raw`A(t)=A_0e^{-\lambda t}`],
  [String.raw`\frac{dy}{dt}=ky`]: [String.raw`y'=ky`, String.raw`\dot{y}=ky`],
  [String.raw`T_d=\frac{\ln 2}{k}`]: [String.raw`t_{1/2}=\frac{\ln 2}{\lambda}`, String.raw`2=e^{kT_d}`],
  [String.raw`F=-kx`]: [String.raw`F_s=-k\Delta x`],
  [String.raw`U=\frac{1}{2}kx^2`]: [String.raw`E_s=\frac{1}{2}k(\Delta x)^2`],
  [String.raw`T=2\pi\sqrt{\frac{m}{k}}`]: [String.raw`T=\frac{2\pi}{\omega}`, String.raw`\omega=\sqrt{\frac{k}{m}}`],
  [String.raw`x=v_0\cos(\theta)t`]: [String.raw`x(t)=v_{0x}t`],
  [String.raw`y=v_0\sin(\theta)t-\frac{1}{2}gt^2`]: [String.raw`y(t)=v_{0y}t-\frac{1}{2}gt^2`],
  [String.raw`R=\frac{v_0^2\sin(2\theta)}{g}`]: [String.raw`range=\frac{v_0^2\sin(2\theta)}{g}`],
  [String.raw`y=y_1+y_2`]: [String.raw`\psi=\psi_1+\psi_2`],
  [String.raw`y=A_1\sin(kx-\omega t)+A_2\sin(kx-\omega t+\phi)`]: [String.raw`y=A_1\sin(kx-\omega t)+A_2\sin(kx-\omega t+\delta)`],
  [String.raw`f'=f\frac{v+v_o}{v-v_s}`]: [String.raw`f_{\mathrm{obs}}=f_s\frac{c+v_o}{c-v_s}`, String.raw`\nu'=\nu\frac{v+v_o}{v-v_s}`],
  [String.raw`\lambda_{\mathrm{front}}=\frac{v-v_s}{f}`]: [String.raw`\lambda_{\mathrm{ahead}}=\frac{c-v_s}{f_s}`, String.raw`\lambda=\frac{v_{\mathrm{rel}}}{f}`],
  [String.raw`M=\frac{|v_s|}{v}`]: [String.raw`\mathrm{Mach}=\frac{\mathrm{source\ speed}}{\mathrm{wave\ speed}}`, String.raw`M=\frac{u}{c}`],
  [String.raw`T=2\pi\sqrt{\frac{L}{g}}`]: [String.raw`T=\frac{2\pi}{\omega}`, String.raw`\omega=\sqrt{\frac{g}{L}}`],
  [String.raw`v_{max}=\sqrt{2gL(1-\cos\theta)}`]: [String.raw`v=\sqrt{2g\Delta h}`],
  [String.raw`V=IR`]: [String.raw`I=\frac{V}{R}`, String.raw`R=\frac{V}{I}`],
  [String.raw`P=IV=\frac{V^2}{R}`]: [String.raw`P=I^2R`],
  [String.raw`V_C(t)=V_0\left(1-e^{-t/RC}\right)`]: [String.raw`V_C=V_s(1-e^{-t/\tau})`, String.raw`V_{\mathrm{cap}}(t)=V_{\infty}(1-e^{-t/\tau})`],
  [String.raw`I(t)=\frac{V_0}{R}e^{-t/RC}`]: [String.raw`I=I_0e^{-t/\tau}`, String.raw`I_0=\frac{V_s}{R}`],
  [String.raw`\tau=RC`]: [String.raw`t_c=RC`, String.raw`\tau=R_{\mathrm{th}}C`],
  [String.raw`E_C=\frac{1}{2}CV_C^2`]: [String.raw`U_C=\frac{1}{2}CV^2`, String.raw`E=\frac{Q^2}{2C}`],
  [String.raw`B=\frac{\mu I}{2\pi r}`]: [String.raw`B=\frac{\mu_0\mu_r I}{2\pi r}`, String.raw`\oint \vec{B}\cdot d\vec{\ell}=\mu I`],
  [String.raw`\tan\phi=\frac{B}{B_E}`]: [String.raw`\phi=\arctan\left(\frac{B_{\mathrm{wire}}}{B_E}\right)`],
  [String.raw`u_B=\frac{B^2}{2\mu}`]: [String.raw`u=\frac{B^2}{2\mu_0\mu_r}`, String.raw`U/V=B^2/(2\mu)`],
  [String.raw`F=k\frac{q_1q_2}{r^2}`]: [String.raw`\vec{F}_{12}=k\frac{q_1q_2}{r^2}\hat{r}`, String.raw`F=\frac{1}{4\pi\epsilon}\frac{q_1q_2}{r^2}`],
  [String.raw`E=k\frac{q}{r^2}`]: [String.raw`\vec{E}=k\frac{q}{r^2}\hat{r}`, String.raw`E=\frac{F}{q_{\mathrm{test}}}`],
  [String.raw`U=k\frac{q_1q_2}{r}`]: [String.raw`U=\frac{1}{4\pi\epsilon}\frac{q_1q_2}{r}`, String.raw`\Delta U=-W_{\mathrm{field}}`],
  [String.raw`\mathrm{pH}=-\log_{10}[H^+]`]: [String.raw`\mathrm{pH}=-\log a_{H^+}`, String.raw`[H^+]=10^{-\mathrm{pH}}`],
  [String.raw`n=CV`]: [String.raw`\mathrm{mol}=\mathrm{M}\cdot\mathrm{L}`],
  [String.raw`n_{H^+}=n_{OH^-}`]: [String.raw`C_aV_a=C_bV_b`, String.raw`M_aV_a=M_bV_b`],
  [String.raw`C_1V_1=C_2V_2`]: [String.raw`M_1V_1=M_2V_2`, String.raw`n_1=n_2`],
  [String.raw`C_2=\frac{C_1V_1}{V_2}`]: [String.raw`M_2=\frac{M_1V_1}{V_2}`],
  [String.raw`D=\frac{V_2}{V_1}=\frac{C_1}{C_2}`]: [String.raw`\mathrm{DF}=\frac{\mathrm{final\ volume}}{\mathrm{aliquot\ volume}}`],
  [String.raw`\xi=\min\left(\frac{n_A}{a},\frac{n_B}{b}\right)`]: [String.raw`\mathrm{extent}=\min(n_A/\nu_A,n_B/\nu_B)`, String.raw`\xi_{\max}=\min_i(n_i/\nu_i)`],
  [String.raw`n_P=c\xi`]: [String.raw`\mathrm{mol\ product}=\nu_P\xi`, String.raw`n_{\mathrm{product}}=c\,\xi_{\max}`],
  [String.raw`n_{excess}=n_i-\nu_i\xi`]: [String.raw`n_{\mathrm{leftover}}=n_{\mathrm{start}}-n_{\mathrm{used}}`],
  [String.raw`PV=nRT`]: [String.raw`P=\frac{nRT}{V}`, String.raw`\frac{PV}{T}=nR`],
  [String.raw`P_1V_1=P_2V_2`]: [String.raw`PV=\mathrm{constant}`],
  [String.raw`\frac{V}{T}=\mathrm{constant}`]: [String.raw`\frac{V_1}{T_1}=\frac{V_2}{T_2}`],
  [String.raw`[A]=[A]_0e^{-kt}`]: [String.raw`C=C_0e^{-kt}`, String.raw`\ln[A]=\ln[A]_0-kt`],
  [String.raw`t_{1/2}=\frac{\ln 2}{k}`]: [String.raw`t_{1/2}=0.693/k`],
  [String.raw`\mathrm{rate}=-\frac{d[A]}{dt}=k[A]`]: [String.raw`-\frac{dC}{dt}=kC`, String.raw`v=k[A]`],
  [String.raw`F_N=mg\cos\theta`]: [String.raw`N=mg\cos\theta`],
  [String.raw`F_{\parallel}=mg\sin\theta`]: [String.raw`F_{down}=mg\sin\theta`],
  [String.raw`F_f\leq\mu F_N`]: [String.raw`f_s\leq\mu_sN`],
  [String.raw`F_{\mathrm{net}}=ma`]: [String.raw`\sum F=ma`, String.raw`\vec{F}_{net}=m\vec{a}`],
  [String.raw`a=\frac{F_{\mathrm{net}}}{m}`]: [String.raw`\vec{a}=\frac{\sum \vec{F}}{m}`],
  [String.raw`x=x_0+v_0t+\frac{1}{2}at^2`]: [String.raw`\Delta x=v_0t+\frac{1}{2}at^2`, String.raw`s=ut+\frac{1}{2}at^2`],
  [String.raw`W=Fd\cos\theta`]: [String.raw`W=\vec{F}\cdot\vec{d}`, String.raw`W=F_{\parallel}d`],
  [String.raw`K=\frac{1}{2}mv^2`]: [String.raw`E_k=\frac{1}{2}mv^2`, String.raw`KE=\frac{mv^2}{2}`],
  [String.raw`W_{\mathrm{net}}=\Delta K`]: [String.raw`\sum W=K_f-K_i`, String.raw`W_{net}=\frac{1}{2}mv_f^2-\frac{1}{2}mv_i^2`],
  [String.raw`n_1\sin\theta_1=n_2\sin\theta_2`]: [String.raw`\frac{\sin\theta_1}{\sin\theta_2}=\frac{n_2}{n_1}`, String.raw`n_i\sin\theta_i=n_t\sin\theta_t`],
  [String.raw`v=\frac{c}{n}`]: [String.raw`n=\frac{c}{v}`, String.raw`v_{\mathrm{medium}}=c/n`],
  [String.raw`\theta_c=\sin^{-1}\left(\frac{n_2}{n_1}\right)`]: [String.raw`\sin\theta_c=\frac{n_2}{n_1}`, String.raw`\theta_c=\arcsin(n_t/n_i)`],
  [String.raw`\frac{1}{f}=\frac{1}{d_o}+\frac{1}{d_i}`]: [String.raw`\frac{1}{s_o}+\frac{1}{s_i}=\frac{1}{f}`, String.raw`P=\frac{1}{f}`],
  [String.raw`m=-\frac{d_i}{d_o}`]: [String.raw`M=-\frac{s_i}{s_o}`, String.raw`m=\frac{h_i}{h_o}`],
  [String.raw`h_i=mh_o`]: [String.raw`\frac{h_i}{h_o}=m`, String.raw`h_i=-\frac{d_i}{d_o}h_o`],
  [String.raw`T(t)=T_a+(T_0-T_a)e^{-kt}`]: [String.raw`\Delta T(t)=\Delta T_0e^{-kt}`, String.raw`T-T_a=(T_0-T_a)e^{-kt}`],
  [String.raw`\frac{dT}{dt}=-k(T-T_a)`]: [String.raw`\dot{T}=-k(T-T_{\infty})`, String.raw`\frac{d\Delta T}{dt}=-k\Delta T`],
  [String.raw`t_{\mathrm{half}}=\frac{\ln 2}{k}`]: [String.raw`t_{1/2}=\frac{0.693}{k}`, String.raw`\Delta T(t_{1/2})=\frac{1}{2}\Delta T_0`],
  [String.raw`\eta=1-\frac{T_c}{T_h}`]: [String.raw`\eta_{\mathrm{Carnot}}=\frac{T_h-T_c}{T_h}`, String.raw`\eta_{\max}=1-\frac{T_{\mathrm{cold}}}{T_{\mathrm{hot}}}`],
  [String.raw`W=\eta Q_h`]: [String.raw`W=Q_h-Q_c`, String.raw`\eta=\frac{W}{Q_h}`],
  [String.raw`Q_c=Q_h-W=Q_h\frac{T_c}{T_h}`]: [String.raw`\frac{Q_c}{Q_h}=\frac{T_c}{T_h}`, String.raw`Q_h=W+Q_c`],
  [String.raw`\rho=\frac{m}{V}`]: [String.raw`D=\frac{m}{V}`, String.raw`m=\rho V`],
  [String.raw`F_b=\rho_f g V_{\mathrm{disp}}`]: [String.raw`B=\rho_{\mathrm{fluid}}gV_{\mathrm{sub}}`, String.raw`F_b=w_{\mathrm{displaced\ fluid}}`],
  [String.raw`\rho_o\le\rho_f\Rightarrow\mathrm{float}`]: [String.raw`\frac{\rho_o}{\rho_f}\le 1`, String.raw`W\le F_b`],
  [String.raw`v=r\omega`]: [String.raw`v_t=\omega r`],
  [String.raw`a_c=\frac{v^2}{r}=r\omega^2`]: [String.raw`a_r=\frac{v^2}{r}`, String.raw`a_r=\omega^2r`],
  [String.raw`F_c=ma_c`]: [String.raw`F_r=\frac{mv^2}{r}`],
  [String.raw`T=\frac{2\pi}{\omega}`]: [String.raw`T=\frac{1}{f}`, String.raw`\omega=2\pi f`],
  [String.raw`F_g=G\frac{m_1m_2}{r^2}`]: [String.raw`\vec{F}_{12}=-G\frac{m_1m_2}{r^2}\hat{r}`, String.raw`F=\frac{GMm}{r^2}`],
  [String.raw`g=G\frac{M}{r^2}`]: [String.raw`\vec{g}=-G\frac{M}{r^2}\hat{r}`, String.raw`a_g=GM/r^2`],
  [String.raw`U=-G\frac{m_1m_2}{r}`]: [String.raw`V=-\frac{GM}{r}`, String.raw`U=mV`],
  [String.raw`T=2\pi\sqrt{\frac{r^3}{G(m_1+m_2)}}`]: [String.raw`T^2=\frac{4\pi^2r^3}{G(m_1+m_2)}`, String.raw`n^2r^3=G(m_1+m_2)`],
  [String.raw`\ce{R2CHOH -> R2C=O}`]: [String.raw`\ce{R2CHOH + [O] -> R2C=O + H2O}`],
  [String.raw`\ce{RCH2OH -> RCHO -> RCO2H}`]: [String.raw`\ce{RCH2OH + 2[O] -> RCO2H + H2O}`],
};

const equationHelp: Record<string, string> = {
  [String.raw`E = hf = \frac{hc}{\lambda}`]:
    "Comes from Planck's photon relation E = hf and the wave relation c = f lambda. In plain English: one photon's energy rises with frequency and falls with wavelength. Alternate notation: E = h nu, E_gamma = hc/lambda.",
  [String.raw`K_{max} = hf - \phi`]:
    "Comes from energy conservation at the metal surface. In plain English: the fastest electron keeps whatever photon energy is left after paying the work-function cost. Alternate notation: KE_max = h nu - W, or E_k,max = h nu - Phi.",
  [String.raw`V_s = \frac{K_{max}}{e}`]:
    "Comes from equating electric potential energy eV_s with maximum kinetic energy. In plain English: the stopping voltage is the voltage just strong enough to halt the fastest emitted electrons. Alternate notation: eV_0 = K_max.",
  [String.raw`\lambda_0 = \frac{hc}{\phi_{eff}}`]:
    "Comes from setting photon energy equal to the effective work function at threshold. In plain English: this is the longest wavelength that can still eject electrons. Alternate notation: lambda_threshold = hc/W_eff.",
  [String.raw`\Delta y = \frac{\lambda L}{d}`]:
    "Comes from the small-angle double-slit condition d sin theta = m lambda and y approximately L theta. In plain English: fringes spread out with wavelength and screen distance, and compress when slits are farther apart. Alternate notation: fringe spacing s = lambda D / a.",
  [String.raw`I = I_0\cos^2(\beta)\operatorname{sinc}^2(\alpha)`]:
    "Comes from multiplying two-slit interference by the single-slit diffraction envelope. In plain English: cosine squared makes bright and dark bands, while sinc squared fades the outer bands. Alternate notation: I(theta) = Imax cos^2(delta/2)(sin alpha / alpha)^2.",
  [String.raw`\beta = \frac{\pi d\sin\theta}{\lambda}`]:
    "Comes from half the phase difference between light from the two slits. In plain English: beta measures how far out of step the two waves are at an angle. Alternate notation: delta = 2 pi d sin(theta) / lambda, with beta = delta/2.",
  [String.raw`SE = \frac{s}{\sqrt{n}}`]:
    "Comes from the variance of an average: independent noise shrinks by square root of sample size. In plain English: bigger samples make the sample mean less jumpy. Alternate notation: SEM = s/sqrt(n), or sigma_xbar = sigma/sqrt(n) when population sigma is known.",
  [String.raw`t = \frac{\bar{x} - \mu_0}{SE}`]:
    "Comes from standardizing the distance between a sample mean and a hypothesized mean using estimated standard error. In plain English: t says how many standard errors the sample mean is from the null mean. Alternate notation: t_stat = (xbar - mu0)/(s/sqrt(n)).",
  [String.raw`CI = \bar{x} \pm t^* SE`]:
    "Comes from centering an interval on the estimate and extending by a critical t multiplier. In plain English: estimate plus or minus an uncertainty margin. Alternate notation: xbar +/- t_{alpha/2,df} s/sqrt(n).",
  [String.raw`\vec{R}=\vec{A}+\vec{B}`]:
    "This is the fundamental vector-addition rule. In plain English: the resultant is what you get by applying vector A and vector B together. Alternate notation: R = A + B, or component form R_x = A_x + B_x and R_y = A_y + B_y.",
  [String.raw`|\vec{R}|=\sqrt{R_x^2+R_y^2}`]:
    "Comes from the Pythagorean theorem applied to perpendicular vector components. In plain English: the resultant length is found from its horizontal and vertical parts. Alternate notation: R = sqrt(Rx^2 + Ry^2).",
  [String.raw`\hat{y}=b_0+b_1x`]:
    "This is the straight-line prediction model. In plain English: predicted y equals an intercept plus a slope times x. Alternate notation: y-hat = beta0 + beta1 x, or y = mx + c.",
  [String.raw`b_1=\frac{\sum(x_i-\bar{x})(y_i-\bar{y})}{\sum(x_i-\bar{x})^2}`]:
    "Comes from minimizing the sum of squared residuals with respect to slope. In plain English: slope is how much x and y vary together divided by how much x varies by itself. Alternate notation: b1 = Cov(x,y)/Var(x).",
  [String.raw`R^2=1-\frac{SS_{res}}{SS_{tot}}`]:
    "Comes from comparing leftover squared error with total squared variation around the mean. In plain English: R squared is the fraction of variation explained by the line. Alternate notation: R^2 = SS_reg/SS_tot, and in simple linear regression it equals correlation squared.",
  [String.raw`a^2+b^2=c^2`]:
    "Comes from comparing square areas built on the three sides of a right triangle. In plain English: the two leg-square areas add to the hypotenuse-square area. Alternate notation: c^2 = a^2 + b^2, or x^2 + y^2 = r^2 in coordinates.",
  [String.raw`c=\sqrt{a^2+b^2}`]:
    "Comes from rearranging the Pythagorean theorem to solve for the hypotenuse length. In plain English: straight-line distance comes from combining perpendicular horizontal and vertical distances. Alternate notation: d = sqrt(Delta x^2 + Delta y^2).",
  [String.raw`A_{\triangle}=\frac{1}{2}ab`]:
    "Comes from taking half of the rectangle made by perpendicular legs a and b. In plain English: a right triangle is half a rectangle with the same base and height. Alternate notation: Area = base times height divided by 2.",
  [String.raw`x=\cos\theta`]:
    "Comes from placing a radius-one triangle inside the coordinate plane. In plain English: cosine is the horizontal coordinate of the point at angle theta. Alternate notation: cos theta = adjacent / hypotenuse.",
  [String.raw`y=\sin\theta`]:
    "Comes from the same radius-one triangle. In plain English: sine is the vertical coordinate of the point at angle theta. Alternate notation: sin theta = opposite / hypotenuse.",
  [String.raw`\sin^2\theta+\cos^2\theta=1`]:
    "Comes from the Pythagorean theorem on a unit circle. In plain English: the squared horizontal and vertical coordinates always add to one. Alternate notation: x^2 + y^2 = 1.",
  [String.raw`\tan\theta=\frac{\sin\theta}{\cos\theta}`]:
    "Comes from tangent as rise over run on the unit circle. In plain English: tangent compares vertical coordinate to horizontal coordinate and becomes undefined when cosine is zero. Alternate notation: tan theta = y/x.",
  [String.raw`P(X=k)=\binom{n}{k}p^k(1-p)^{n-k}`]:
    "Comes from counting the ways k successes can appear among n independent trials, then multiplying by the probability of each success-failure pattern. In plain English: combinations count the positions, while p and 1-p weight the outcome. Alternate notation: Pr(X=k) = n choose k p^k q^(n-k).",
  [String.raw`\mu=np`]:
    "Comes from adding the expected value of n identical Bernoulli trials. In plain English: average successes equals number of tries times chance of success per try. Alternate notation: E[X] = np.",
  [String.raw`\sigma=\sqrt{np(1-p)}`]:
    "Comes from the variance of independent Bernoulli trials adding together. In plain English: spread grows with trial count and is largest when success and failure are both plausible. Alternate notation: Var(X) = np(1-p).",
  [String.raw`y=y_0e^{kt}`]:
    "Comes from solving the proportional-change equation dy/dt = ky. In plain English: the current amount equals the starting amount multiplied by an exponential growth or decay factor. Alternate notation: N(t) = N0 e^(rt), or A(t) = A0 e^(-lambda t) for decay.",
  [String.raw`\frac{dy}{dt}=ky`]:
    "This is the defining differential equation for exponential change. In plain English: the instantaneous rate of change is proportional to how much is already present. Alternate notation: y' = ky or y-dot = ky.",
  [String.raw`T_d=\frac{\ln 2}{k}`]:
    "Comes from setting y/y0 = 2 in y = y0 e^(kt), then solving for time. In plain English: doubling time is how long positive exponential growth takes to multiply by two; with decay the analogous half-life is ln 2 divided by the decay constant. Alternate notation: t_1/2 = ln 2 / lambda.",
  [String.raw`F=-kx`]:
    "This is Hooke's law for an ideal spring. In plain English: the restoring force grows with stretch and points back toward equilibrium. Alternate notation: F_s = -k Delta x.",
  [String.raw`U=\frac{1}{2}kx^2`]:
    "Comes from integrating Hooke's-law force over displacement. In plain English: spring energy rises with the square of stretch or compression. Alternate notation: E_s = 1/2 k(Delta x)^2.",
  [String.raw`T=2\pi\sqrt{\frac{m}{k}}`]:
    "Comes from solving the ideal mass-spring oscillator equation. In plain English: heavier masses oscillate slower; stiffer springs oscillate faster. Alternate notation: period = 2 pi / omega with omega = sqrt(k/m).",
  [String.raw`x=v_0\cos(\theta)t`]:
    "Comes from constant horizontal velocity in ideal projectile motion. In plain English: horizontal position equals horizontal speed times time. Alternate notation: x(t) = v0x t.",
  [String.raw`y=v_0\sin(\theta)t-\frac{1}{2}gt^2`]:
    "Comes from constant downward acceleration under gravity. In plain English: the projectile rises from its initial vertical speed while gravity pulls it down quadratically over time. Alternate notation: y(t) = v0y t - gt^2/2.",
  [String.raw`R=\frac{v_0^2\sin(2\theta)}{g}`]:
    "Comes from solving the projectile equations for when height returns to launch height. In plain English: range depends on launch speed squared and launch angle. Alternate notation: range = v0^2 sin(2 theta)/g.",
  [String.raw`y=y_1+y_2`]:
    "This is the linear superposition principle. In plain English: when small waves overlap, their displacements add point by point. Alternate notation: psi = psi1 + psi2.",
  [String.raw`y=A_1\sin(kx-\omega t)+A_2\sin(kx-\omega t+\phi)`]:
    "Comes from adding two sinusoidal waves with a phase offset. In plain English: amplitude and phase decide whether the waves reinforce or cancel. Alternate notation: y = A1 sin(kx - omega t) + A2 sin(kx - omega t + delta).",
  [String.raw`f'=f\frac{v+v_o}{v-v_s}`]:
    "Comes from counting how often compressed or stretched wavefronts reach the observer. In plain English: the heard frequency rises when the observer moves into the waves or the source moves toward the observer, and falls for recession. Alternate notation: f_obs = f_s(c + v_o)/(c - v_s).",
  [String.raw`\lambda_{\mathrm{front}}=\frac{v-v_s}{f}`]:
    "Comes from the distance a wavefront gains during one source period while the source also moves forward. In plain English: the wavelength in front shrinks as the source speed approaches the wave speed. Alternate notation: lambda_ahead = (c - v_s)/f_s.",
  [String.raw`M=\frac{|v_s|}{v}`]:
    "This is the Mach number definition for a source moving through a wave medium. In plain English: Mach number compares source speed with wave speed; above 1, the source outruns its own wavefronts. Alternate notation: M = u/c.",
  [String.raw`T=2\pi\sqrt{\frac{L}{g}}`]:
    "Comes from the small-angle pendulum approximation. In plain English: a longer pendulum swings slower, and stronger gravity makes it swing faster. Alternate notation: period = 2 pi / omega with omega = sqrt(g/L).",
  [String.raw`v_{max}=\sqrt{2gL(1-\cos\theta)}`]:
    "Comes from converting gravitational potential energy into kinetic energy at the bottom of the swing. In plain English: a larger release angle creates a faster bottom speed. Alternate notation: v = sqrt(2g Delta h).",
  [String.raw`V=IR`]:
    "This is Ohm's law for an ohmic conductor. In plain English: voltage equals current times resistance. Alternate notation: I = V/R or R = V/I.",
  [String.raw`P=IV=\frac{V^2}{R}`]:
    "Comes from electric power P = IV combined with Ohm's law. In plain English: power is the rate electrical energy is converted, and at fixed resistance it rises with voltage squared. Alternate notation: P = I^2R.",
  [String.raw`V_C(t)=V_0\left(1-e^{-t/RC}\right)`]:
    "Comes from solving the charging differential equation dV_C/dt = (V_0 - V_C)/(RC). In plain English: capacitor voltage rises quickly at first, then creeps toward the source voltage as the gap gets smaller. Alternate notation: V_C = V_s(1 - e^(-t/tau)).",
  [String.raw`I(t)=\frac{V_0}{R}e^{-t/RC}`]:
    "Comes from Ohm's law applied to the resistor voltage V_R = V_0 - V_C during charging. In plain English: current starts at V_0/R and decays because the capacitor pushes back with more voltage over time. Alternate notation: I = I_0 e^(-t/tau).",
  [String.raw`\tau=RC`]:
    "This is the RC time constant definition for a first-order resistor-capacitor circuit. In plain English: resistance slows charge flow and capacitance stores more charge, so their product sets the charging pace. Alternate notation: tau = R_th C when the capacitor sees a Thevenin resistance.",
  [String.raw`E_C=\frac{1}{2}CV_C^2`]:
    "Comes from integrating capacitor work dE = V dQ with Q = CV. In plain English: stored energy grows with capacitance and with voltage squared. Alternate notation: U_C = 1/2 C V^2 or E = Q^2/(2C).",
  [String.raw`B=\frac{\mu I}{2\pi r}`]:
    "Comes from Ampere's law applied to a circular path around a long straight wire. In plain English: magnetic field gets stronger with current and weaker with distance from the wire. Alternate notation: B = mu0 mu_r I/(2 pi r).",
  [String.raw`\tan\phi=\frac{B}{B_E}`]:
    "Comes from resolving a compass needle between the wire's sideways field and Earth's background field. In plain English: the needle turns more when the wire field is large compared with Earth field. Alternate notation: phi = arctan(B_wire/B_E).",
  [String.raw`u_B=\frac{B^2}{2\mu}`]:
    "Comes from magnetic field energy density in a linear medium. In plain English: stronger magnetic fields store more energy per volume, scaling with B squared. Alternate notation: U/V = B^2/(2 mu).",
  [String.raw`F=k\frac{q_1q_2}{r^2}`]:
    "This is Coulomb's inverse-square force law for point charges. In plain English: charge magnitudes strengthen the force, distance weakens it by r squared, and the sign tells attraction or repulsion. Alternate notation: F = (1/(4 pi epsilon)) q1 q2 / r^2.",
  [String.raw`E=k\frac{q}{r^2}`]:
    "Comes from defining electric field as force per unit positive test charge. In plain English: a charge creates a field around it, and the field weakens with distance squared. Alternate notation: vector E = k q r-hat / r^2.",
  [String.raw`U=k\frac{q_1q_2}{r}`]:
    "Comes from integrating Coulomb force over separation. In plain English: potential energy tracks the work stored in the charge arrangement, positive for like-charge repulsion and negative for attraction. Alternate notation: U = qV for one charge in another charge's potential.",
  [String.raw`\mathrm{pH}=-\log_{10}[H^+]`]:
    "Comes from Sorensen's logarithmic acidity scale. In plain English: pH is a compact way to report hydrogen-ion concentration; lowering pH by 1 means ten times more hydrogen ion. Alternate notation uses hydrogen ion activity a_H+ instead of concentration.",
  [String.raw`n=CV`]:
    "Comes from the definition of molarity as moles per liter. In plain English: moles equal concentration times solution volume. Alternate notation: mol = M times L.",
  [String.raw`n_{H^+}=n_{OH^-}`]:
    "This is the strong acid-strong base equivalence condition. In plain English: equivalence happens when added hydroxide moles match the starting hydrogen-ion moles. Alternate notation: C_a V_a = C_b V_b for one-to-one reactions.",
  [String.raw`C_1V_1=C_2V_2`]:
    "Comes from conserving solute amount during dilution because moles equal concentration times volume. In plain English: the solute transferred from the stock is the same solute present after adding solvent. Alternate notation: M1V1 = M2V2.",
  [String.raw`C_2=\frac{C_1V_1}{V_2}`]:
    "Comes from rearranging the dilution equation to solve for final concentration. In plain English: final molarity equals stock molarity scaled by aliquot volume divided by final volume. Alternate notation: M2 = M1 V1 / V2.",
  [String.raw`D=\frac{V_2}{V_1}=\frac{C_1}{C_2}`]:
    "Comes from comparing final volume to transferred aliquot volume. In plain English: a larger dilution factor means the stock has been spread into more total liquid, so concentration falls by that factor. Alternate notation: DF = final volume / aliquot volume.",
  [String.raw`\xi=\min\left(\frac{n_A}{a},\frac{n_B}{b}\right)`]:
    "Comes from dividing each available reactant amount by its balanced-equation coefficient. In plain English: the smaller ratio says how many full reaction batches can actually happen, so it identifies the limiting reactant. Alternate notation: xi_max = min_i(n_i/nu_i).",
  [String.raw`n_P=c\xi`]:
    "Comes from multiplying reaction extent by the product coefficient. In plain English: once the limiting reactant sets how far the reaction goes, the product coefficient converts that extent into product moles. Alternate notation: n_product = nu_product xi.",
  [String.raw`n_{excess}=n_i-\nu_i\xi`]:
    "Comes from subtracting the amount consumed from the amount initially present. In plain English: excess reactant is what remains after the limiting reactant has stopped the reaction. Alternate notation: leftover = starting amount - used amount.",
  [String.raw`PV=nRT`]:
    "Comes from combining Boyle's, Charles's, Avogadro's, and Gay-Lussac-style gas relations into one state equation. In plain English: pressure times volume is set by how much gas there is and how hot it is. Alternate notation: P = nRT/V, or PV/T = nR.",
  [String.raw`P_1V_1=P_2V_2`]:
    "This is Boyle's law for a fixed amount of gas at constant temperature. In plain English: squeezing volume down pushes pressure up by the same factor. Alternate notation: PV = constant.",
  [String.raw`\frac{V}{T}=\mathrm{constant}`]:
    "This is Charles's law for a fixed amount of gas at constant pressure using absolute temperature. In plain English: hotter gas occupies more volume if pressure is allowed to stay the same. Alternate notation: V1/T1 = V2/T2.",
  [String.raw`[A]=[A]_0e^{-kt}`]:
    "Comes from integrating the first-order rate law. In plain English: the reactant concentration falls by the same fraction over equal time intervals. Alternate notation: C = C0 e^{-kt}, or ln[A] = ln[A]0 - kt.",
  [String.raw`t_{1/2}=\frac{\ln 2}{k}`]:
    "Comes from setting the first-order concentration equal to half its starting value. In plain English: half-life is the time required for half the reactant to remain, and for first-order reactions it depends only on k. Alternate notation: t1/2 = 0.693/k.",
  [String.raw`\mathrm{rate}=-\frac{d[A]}{dt}=k[A]`]:
    "This is the first-order differential rate law. In plain English: the reaction goes faster when more reactant is present, and the minus sign means reactant concentration is decreasing. Alternate notation: -dC/dt = kC or v = k[A].",
  [String.raw`F_N=mg\cos\theta`]:
    "Comes from resolving weight perpendicular to an inclined plane. In plain English: the surface push is the perpendicular part of the object's weight. Alternate notation: N = mg cos theta.",
  [String.raw`F_{\parallel}=mg\sin\theta`]:
    "Comes from resolving weight parallel to an inclined plane. In plain English: this is the downhill pull along the ramp. Alternate notation: F_down = mg sin theta.",
  [String.raw`F_f\leq\mu F_N`]:
    "This is the Coulomb friction model. In plain English: static friction can match the needed opposing force up to a maximum set by friction coefficient times normal force. Alternate notation: f_s <= mu_s N.",
  [String.raw`F_{\mathrm{net}}=ma`]:
    "This is Newton's second law in constant-mass form. In plain English: acceleration is caused by the total unbalanced force after opposing forces are included. Alternate notation: sum F = ma or vector F_net = m a.",
  [String.raw`a=\frac{F_{\mathrm{net}}}{m}`]:
    "Comes from rearranging Newton's second law to solve for acceleration. In plain English: the same net force accelerates a light object more than a heavy object. Alternate notation: vector a = sum vector F divided by m.",
  [String.raw`x=x_0+v_0t+\frac{1}{2}at^2`]:
    "Comes from integrating constant acceleration twice: acceleration changes velocity, and velocity changes position. In plain English: with steady acceleration, displacement grows with time squared. Alternate notation: s = ut + 1/2 at^2.",
  [String.raw`W=Fd\cos\theta`]:
    "Comes from the dot product between force and displacement. In plain English: only the force component along the direction of motion transfers mechanical energy. Alternate notation: W = F dot d or W = F_parallel d.",
  [String.raw`K=\frac{1}{2}mv^2`]:
    "Comes from integrating the work needed to accelerate a mass from rest to speed v. In plain English: kinetic energy grows with mass and with speed squared. Alternate notation: KE = mv^2/2.",
  [String.raw`W_{\mathrm{net}}=\Delta K`]:
    "This is the work-energy theorem. In plain English: the total work done by all forces equals the change in kinetic energy. Alternate notation: sum W = K_f - K_i.",
  [String.raw`n_1\sin\theta_1=n_2\sin\theta_2`]:
    "Comes from matching the wave phase along a boundary, or equivalently from Fermat's least-time principle. In plain English: light bends so the sine of each angle balances the speed change between media. Alternate notation: sin(theta1)/sin(theta2) = n2/n1.",
  [String.raw`v=\frac{c}{n}`]:
    "This is the definition of refractive index for phase speed in a medium. In plain English: a larger refractive index means light travels more slowly in that material. Alternate notation: n = c/v.",
  [String.raw`\theta_c=\sin^{-1}\left(\frac{n_2}{n_1}\right)`]:
    "Comes from Snell's law by setting the refracted angle to 90 degrees as the limiting grazing ray. In plain English: above this angle, light cannot escape into the lower-index medium and reflects internally. Alternate notation: theta_c = arcsin(n_t/n_i).",
  [String.raw`\frac{1}{f}=\frac{1}{d_o}+\frac{1}{d_i}`]:
    "Comes from similar triangles in the paraxial thin-lens approximation. In plain English: focal length, object distance, and image distance are locked together; moving one changes where the image forms. Alternate notation: 1/s_o + 1/s_i = 1/f.",
  [String.raw`m=-\frac{d_i}{d_o}`]:
    "Comes from comparing the object and image triangles drawn by chief rays. In plain English: magnification is image distance divided by object distance, with the minus sign marking inversion for real images. Alternate notation: M = -s_i/s_o.",
  [String.raw`h_i=mh_o`]:
    "Comes from the definition of lateral magnification. In plain English: image height equals object height multiplied by magnification, so large absolute m makes a taller image. Alternate notation: h_i/h_o = m.",
  [String.raw`T(t)=T_a+(T_0-T_a)e^{-kt}`]:
    "Comes from solving the first-order cooling equation. In plain English: the object temperature equals ambient temperature plus a shrinking fraction of the starting temperature gap. Alternate notation: Delta T(t) = Delta T0 e^(-kt).",
  [String.raw`\frac{dT}{dt}=-k(T-T_a)`]:
    "This is Newton's cooling model. In plain English: the temperature changes fastest when the object is far from ambient, and the minus sign points the change back toward ambient temperature. Alternate notation: d(Delta T)/dt = -k Delta T.",
  [String.raw`t_{\mathrm{half}}=\frac{\ln 2}{k}`]:
    "Comes from setting the remaining temperature gap to one half in the exponential cooling solution. In plain English: half-time is how long it takes the object to cut its temperature difference from ambient in half. Alternate notation: t_1/2 = 0.693/k.",
  [String.raw`\eta=1-\frac{T_c}{T_h}`]:
    "Comes from the reversible Carnot cycle and the second law, using absolute temperatures. In plain English: the best possible engine gets more efficient when the hot reservoir is hotter or the cold reservoir is colder. Alternate notation: eta_Carnot = (T_h - T_c)/T_h.",
  [String.raw`W=\eta Q_h`]:
    "Comes from defining thermal efficiency as useful work divided by heat absorbed from the hot reservoir. In plain English: work output is the input heat multiplied by the engine's efficiency. Alternate notation: eta = W/Q_h or W = Q_h - Q_c.",
  [String.raw`Q_c=Q_h-W=Q_h\frac{T_c}{T_h}`]:
    "Comes from energy conservation plus the reversible Carnot heat ratio. In plain English: whatever heat is not converted to work must be rejected to the cold reservoir. Alternate notation: Q_c/Q_h = T_c/T_h.",
  [String.raw`\rho=\frac{m}{V}`]:
    "This is the definition of density. In plain English: density says how much mass is packed into each unit of volume. Alternate notation: D = m/V or m = rho V.",
  [String.raw`F_b=\rho_f g V_{\mathrm{disp}}`]:
    "Comes from Archimedes' principle: buoyant force equals the weight of displaced fluid. In plain English: denser fluid, stronger gravity, or more displaced volume creates more upward force. Alternate notation: B = rho_fluid g V_sub.",
  [String.raw`\rho_o\le\rho_f\Rightarrow\mathrm{float}`]:
    "Comes from comparing the object density with the fluid density. In plain English: an object can float if it can displace enough fluid before becoming fully submerged; if it is denser than the fluid, it sinks. Alternate notation: rho_o/rho_f <= 1.",
  [String.raw`v=r\omega`]:
    "Comes from arc length s = r theta differentiated with respect to time. In plain English: speed around the circle equals radius times angular speed. Alternate notation: v_t = omega r.",
  [String.raw`a_c=\frac{v^2}{r}=r\omega^2`]:
    "Comes from changing velocity direction during circular motion. In plain English: inward acceleration grows with speed squared and points to the center. Alternate notation: a_r = v^2/r or omega^2 r.",
  [String.raw`F_c=ma_c`]:
    "Comes from Newton's second law applied to centripetal acceleration. In plain English: inward force is mass times inward acceleration. Alternate notation: F_radial = mv^2/r.",
  [String.raw`T=\frac{2\pi}{\omega}`]:
    "Comes from one full revolution being 2 pi radians. In plain English: the period is the time for one complete orbit. Alternate notation: period = 1/f, with omega = 2 pi f.",
  [String.raw`F_g=G\frac{m_1m_2}{r^2}`]:
    "This is Newton's universal gravitation law. In plain English: every pair of masses attracts, the pull grows with both masses, and distance weakens it by r squared. Alternate notation: vector F = -G m1 m2 r-hat / r^2.",
  [String.raw`g=G\frac{M}{r^2}`]:
    "Comes from dividing gravitational force by a small test mass. In plain English: field strength is the acceleration a probe would feel near mass M. Alternate notation: a_g = GM/r^2 or vector g = -GM r-hat/r^2.",
  [String.raw`U=-G\frac{m_1m_2}{r}`]:
    "Comes from integrating the inverse-square gravitational force and choosing zero energy at infinite separation. In plain English: bound masses have negative potential energy, and moving them farther apart raises U toward zero. Alternate notation: gravitational potential V = -GM/r and U = mV.",
  [String.raw`T=2\pi\sqrt{\frac{r^3}{G(m_1+m_2)}}`]:
    "Comes from setting circular-orbit centripetal acceleration equal to gravitational acceleration. In plain English: wider orbits take longer, while more total mass makes the orbit faster. Alternate notation: T^2 = 4 pi^2 r^3 / G(m1 + m2).",
  [String.raw`\ce{R2CHOH -> R2C=O}`]:
    "This is the standard secondary-alcohol oxidation summary. In plain English: the alcohol carbon loses hydrogen and becomes a ketone carbonyl. Alternate notation: R2CHOH + [O] -> R2C=O + H2O.",
  [String.raw`\ce{RCH2OH -> RCHO -> RCO2H}`]:
    "This summarizes primary-alcohol oxidation through an aldehyde. In plain English: primary alcohols can oxidize once to aldehydes and further to carboxylic acids under aqueous strong conditions. Alternate notation: RCH2OH + 2[O] -> RCO2H + H2O.",
  [String.raw`\ce{harsh [O] -> acid fragments}`]:
    "This represents oxidative cleavage, not normal direct secondary-alcohol oxidation. In plain English: harsh oxidants can break carbon-carbon bonds and produce smaller acid fragments. Alternate notation: oxidative C-C cleavage under strong [O].",
};

function renderMath(math: string, displayMode: boolean) {
  return katex.renderToString(math, {
    displayMode,
    throwOnError: false,
    strict: "ignore",
    trust: false,
    output: "html",
  });
}

function EquationTooltip({ math, text }: { math: string; text: string }) {
  const alternates = alternateNotation[math] ?? [];
  return (
    <span className="equationTooltip" role="tooltip">
      <span className="equationTooltipTitle">Equation</span>
      <span
        className="equationTooltipMath"
        dangerouslySetInnerHTML={{ __html: renderMath(math, false) }}
      />
      <span className="equationTooltipText">{text}</span>
      {alternates.length ? (
        <span className="equationTooltipAlternates">
          <span className="equationTooltipTitle">Alternate Notation</span>
          {alternates.map((alternate) => (
            <span
              key={alternate}
              className="equationTooltipMath"
              dangerouslySetInnerHTML={{ __html: renderMath(alternate, false) }}
            />
          ))}
        </span>
      ) : null}
    </span>
  );
}

export function InlineMath({ math, label, help }: EquationProps) {
  const helpText = help ?? equationHelp[math];
  return (
    <span
      className={`mathInline ${helpText ? "equationWithHelp" : ""}`}
      aria-label={label}
      tabIndex={helpText ? 0 : undefined}
    >
      <span dangerouslySetInnerHTML={{ __html: renderMath(math, false) }} />
      {helpText ? <EquationTooltip math={math} text={helpText} /> : null}
    </span>
  );
}

export function BlockMath({ math, label, help }: EquationProps) {
  const helpText = help ?? equationHelp[math];
  return (
    <div
      className={`mathBlock ${helpText ? "equationWithHelp" : ""}`}
      aria-label={label}
      tabIndex={helpText ? 0 : undefined}
    >
      <span dangerouslySetInnerHTML={{ __html: renderMath(math, true) }} />
      {helpText ? <EquationTooltip math={math} text={helpText} /> : null}
    </div>
  );
}

export function ChemInline({ math, label }: EquationProps) {
  return <InlineMath math={`\\ce{${math}}`} label={label} />;
}

export function ChemBlock({ math, label }: EquationProps) {
  return <BlockMath math={`\\ce{${math}}`} label={label} />;
}
