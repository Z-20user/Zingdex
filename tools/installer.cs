// Zingdex 跃索 —— 安装向导
//
// 设计与应用本体同一套语言：纸色底、白卡片、主色绿、圆角、缓动动画。
// 四步：欢迎 → 选择位置 → 安装中 → 完成；每一步都有「上一步」和「取消」。
//
// 发布方式：安装程序 exe 与 app\ 同目录。
// 编译：csc /target:winexe /r:System.Windows.Forms.dll /r:System.Drawing.dll installer.cs

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Win32;
using System.Runtime.InteropServices;
using WinTimer = System.Windows.Forms.Timer;

[assembly: AssemblyTitle("Zingdex 跃索 · 安装向导")]
[assembly: AssemblyCompany("跃索相关团队")]
[assembly: AssemblyVersion("@VER4@")]
[assembly: AssemblyFileVersion("@VER4@")]

static class Meta
{
    public const string NAME = "Zingdex";
    public const string TITLE = "Zingdex 跃索 · 动效组件库";
    public const string VER = "@VER@";
    public const string COUNT = "@COUNT@";

    public static readonly string CHECK_BAT = @"@echo off

chcp 65001 >nul

title Zingdex 残留检查

setlocal enabledelayedexpansion

echo.

echo   Zingdex 跃索 · 残留检查

echo   ==================================================

echo.

set FOUND=0



if exist ""%APPDATA%\Zingdex"" (

  echo   [数据] 设置与授权

  echo          %APPDATA%\Zingdex

  set /a FOUND+=1

)

if exist ""%LOCALAPPDATA%\Zingdex"" (

  echo   [数据] 缓存

  echo          %LOCALAPPDATA%\Zingdex

  set /a FOUND+=1

)

if exist ""%USERPROFILE%\Desktop\Zingdex.lnk"" (

  echo   [快捷方式] 桌面

  echo          %USERPROFILE%\Desktop\Zingdex.lnk

  set /a FOUND+=1

)

if exist ""%APPDATA%\Microsoft\Windows\Start Menu\Programs\Zingdex.lnk"" (

  echo   [快捷方式] 开始菜单

  echo          %APPDATA%\Microsoft\Windows\Start Menu\Programs\Zingdex.lnk

  set /a FOUND+=1

)

reg query ""HKCU\Software\Microsoft\Windows\CurrentVersion\Run"" /v Zingdex >nul 2>&1 && (

  echo   [注册表] 开机启动

  echo          HKCU\Software\Microsoft\Windows\CurrentVersion\Run\Zingdex

  set /a FOUND+=1

)

reg query ""HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\Zingdex"" >nul 2>&1 && (

  echo   [注册表] 卸载登记

  echo          HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\Zingdex

  set /a FOUND+=1

)

reg query ""HKCU\Software\Zingdex"" >nul 2>&1 && (

  echo   [注册表] 程序注册键

  echo          HKCU\Software\Zingdex

  set /a FOUND+=1

)



if ""%FOUND%""==""0"" (

  echo   检查完毕：没有发现任何残留。

  echo.

  pause

  exit /b 0

)



echo.

echo   上面共 %FOUND% 项残留，已按【类型 + 路径】列出。

echo   其中「数据」是设置、授权与缓存；「注册表」是开机启动、卸载登记与程序键。

echo   删除后无法恢复。

echo.

set /p ok=   输入 Y 回车立即清除，直接回车取消： 

if /i not ""%ok%""==""Y"" (

  echo.

  echo   已取消，什么都没做。

  pause

  exit /b 0

)

echo.

echo   正在清除…

rd /s /q ""%APPDATA%\Zingdex"" 2>nul

rd /s /q ""%LOCALAPPDATA%\Zingdex"" 2>nul

del /f /q ""%USERPROFILE%\Desktop\Zingdex.lnk"" 2>nul

del /f /q ""%APPDATA%\Microsoft\Windows\Start Menu\Programs\Zingdex.lnk"" 2>nul

reg delete ""HKCU\Software\Microsoft\Windows\CurrentVersion\Run"" /v Zingdex /f >nul 2>&1

reg delete ""HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\Zingdex"" /f >nul 2>&1

reg delete ""HKCU\Software\Zingdex"" /f >nul 2>&1

echo.

echo   已清除。可以把这个脚本删掉了。

pause

";
}

static class Program
{
    [DllImport("user32.dll")] static extern bool SetProcessDpiAwarenessContext(IntPtr value);
    [DllImport("user32.dll")] static extern bool SetProcessDPIAware();

    /// <summary>不开 DPI 感知的话，125% 缩放下整窗会被系统拉伸，文字就糊了。</summary>
    static void EnableDpi()
    {
        try { if (SetProcessDpiAwarenessContext(new IntPtr(-4))) return; } catch (Exception) { }
        try { SetProcessDPIAware(); } catch (Exception) { }
    }

    [STAThread]
    static int Main(string[] args)
    {
        EnableDpi();
        bool byName = string.Equals(
            Path.GetFileNameWithoutExtension(Assembly.GetExecutingAssembly().Location),
            "Uninstall", StringComparison.OrdinalIgnoreCase);

        if (byName || (args.Length > 0 && args[0] == "--uninstall"))
            return Uninstaller.Run(args);

        if (Array.IndexOf(args, "--silent") >= 0)
            return Installer.Silent(args);

        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        try
        {
            Application.Run(new SetupForm());
            return 0;
        }
        catch (Exception ex)
        {
            MessageBox.Show("安装程序无法启动：\n" + ex.Message, Meta.TITLE,
                MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 1;
        }
    }
}


/* ==================== 自解压负载 ==================== */
// 安装包 = 本体 exe + payload.zip + 24 字节尾部标记。
// 运行时从自身尾部读出 zip 的偏移与长度，用 SubStream 直接在原地解压，
// 不落临时文件，也不需要把整个包读进内存。

class SubStream : Stream
{
    readonly Stream inner;
    readonly long start;
    readonly long len;
    long pos;

    public SubStream(Stream inner, long start, long len)
    {
        this.inner = inner; this.start = start; this.len = len;
        inner.Seek(start, SeekOrigin.Begin);
    }

    public override bool CanRead { get { return true; } }
    public override bool CanSeek { get { return true; } }
    public override bool CanWrite { get { return false; } }
    public override long Length { get { return len; } }
    public override long Position
    {
        get { return pos; }
        set { pos = value; inner.Seek(start + pos, SeekOrigin.Begin); }
    }
    public override int Read(byte[] buffer, int offset, int count)
    {
        long left = len - pos;
        if (left <= 0) return 0;
        if (count > left) count = (int)left;
        int n = inner.Read(buffer, offset, count);
        pos += n;
        return n;
    }
    public override long Seek(long offset, SeekOrigin origin)
    {
        long p = origin == SeekOrigin.Begin ? offset : origin == SeekOrigin.Current ? pos + offset : len + offset;
        Position = p;
        return pos;
    }
    public override void Flush() { }
    public override void SetLength(long value) { throw new NotSupportedException(); }
    public override void Write(byte[] buffer, int offset, int count) { throw new NotSupportedException(); }
}

/* ==================== 主题 ==================== */

static class Ui
{
    public static readonly Color Bg = Color.FromArgb(247, 246, 242);
    public static readonly Color Card = Color.White;
    public static readonly Color Line = Color.FromArgb(227, 224, 213);
    public static readonly Color Ink = Color.FromArgb(20, 22, 15);
    public static readonly Color Ink2 = Color.FromArgb(92, 97, 84);
    public static readonly Color Ink3 = Color.FromArgb(139, 144, 128);
    public static readonly Color Acc = Color.FromArgb(198, 242, 76);
    public static readonly Color AccDeep = Color.FromArgb(79, 107, 0);
    public static readonly Color Track = Color.FromArgb(237, 235, 226);

    public static Font F(float size, bool bold)
    {
        return new Font("Microsoft YaHei UI", size, bold ? FontStyle.Bold : FontStyle.Regular);
    }
}

static class Draw
{
    public static GraphicsPath Round(Rectangle r, int radius)
    {
        GraphicsPath p = new GraphicsPath();
        int d = Math.Min(radius * 2, Math.Min(r.Width, r.Height));
        if (d <= 0) { p.AddRectangle(r); return p; }
        p.AddArc(r.X, r.Y, d, d, 180, 90);
        p.AddArc(r.Right - d, r.Y, d, d, 270, 90);
        p.AddArc(r.Right - d, r.Bottom - d, d, d, 0, 90);
        p.AddArc(r.X, r.Bottom - d, d, d, 90, 90);
        p.CloseFigure();
        return p;
    }

    public static void Fill(Graphics g, Rectangle r, int radius, Color c)
    {
        SmoothingMode old = g.SmoothingMode;
        g.SmoothingMode = SmoothingMode.AntiAlias;
        using (GraphicsPath p = Round(r, radius))
        using (SolidBrush b = new SolidBrush(c))
            g.FillPath(b, p);
        g.SmoothingMode = old;
    }

    public static void Stroke(Graphics g, Rectangle r, int radius, Color c, float w)
    {
        SmoothingMode old = g.SmoothingMode;
        g.SmoothingMode = SmoothingMode.AntiAlias;
        using (GraphicsPath p = Round(r, radius))
        using (Pen pen = new Pen(c, w))
            g.DrawPath(pen, p);
        g.SmoothingMode = old;
    }
}

/* ==================== 缓动动画 ==================== */

static class Anim
{
    public static void Run(int ms, Action<double> frame, Action done)
    {
        WinTimer t = new WinTimer();
        t.Interval = 15;
        Stopwatch sw = Stopwatch.StartNew();
        t.Tick += (s, e) =>
        {
            double k = Math.Min(1.0, sw.ElapsedMilliseconds / (double)ms);
            double eased = 1 - Math.Pow(1 - k, 3);
            try { frame(eased); } catch (Exception) { }
            if (k >= 1)
            {
                t.Stop();
                t.Dispose();
                if (done != null) done();
            }
        };
        t.Start();
    }
}

/* ==================== 控件 ==================== */

class PillButton : Button
{
    public bool Primary = true;
    public bool Soft;

    public PillButton()
    {
        SetStyle(ControlStyles.AllPaintingInWmPaint | ControlStyles.UserPaint
                 | ControlStyles.OptimizedDoubleBuffer | ControlStyles.SupportsTransparentBackColor, true);
        BackColor = Color.Transparent;
        FlatStyle = FlatStyle.Flat;
        FlatAppearance.BorderSize = 0;
        Cursor = Cursors.Hand;
        Font = Ui.F(10f, true);
        Height = 44;
    }

    bool hot;
    protected override void OnMouseEnter(EventArgs e) { hot = true; Invalidate(); base.OnMouseEnter(e); }
    protected override void OnMouseLeave(EventArgs e) { hot = false; Invalidate(); base.OnMouseLeave(e); }

    protected override void OnPaint(PaintEventArgs e)
    {
        Graphics g = e.Graphics;
        if (Parent != null) g.Clear(Parent.BackColor); else g.Clear(Ui.Bg);

        Color bg, fg;
        if (Primary) { bg = hot ? Color.FromArgb(214, 250, 120) : Ui.Acc; fg = Ui.Ink; }
        else if (Soft) { bg = hot ? Color.FromArgb(240, 239, 232) : Ui.Bg; fg = Ui.Ink2; }
        else { bg = hot ? Color.FromArgb(250, 250, 246) : Ui.Card; fg = Ui.Ink2; }

        Rectangle r = new Rectangle(0, 0, Width - 1, Height - 1);
        Draw.Fill(g, r, Height / 2, bg);
        if (!Primary) Draw.Stroke(g, r, Height / 2, Ui.Line, 1.2f);
        TextRenderer.DrawText(g, Text, Font, r, fg,
            TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter);
    }
}

class ProgressLine : Control
{
    double pct;
    double phase;

    public ProgressLine()
    {
        SetStyle(ControlStyles.AllPaintingInWmPaint | ControlStyles.UserPaint
                 | ControlStyles.OptimizedDoubleBuffer, true);
        BackColor = Ui.Bg;
    }

    public void Set(double v)
    {
        pct = Math.Max(0, Math.Min(1, v));
        Invalidate();
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        Graphics g = e.Graphics;
        g.Clear(Parent != null ? Parent.BackColor : Ui.Bg);

        Rectangle track = new Rectangle(0, Height / 2 - 5, Width, 10);
        Draw.Fill(g, track, 5, Ui.Track);

        int w = (int)(Width * pct);
        if (w > 10)
        {
            Rectangle fill = new Rectangle(0, track.Y, w, 10);
            Draw.Fill(g, fill, 5, Ui.Acc);

            // 主色条上跑一条微光，和应用里的加载动效是同一套感觉
            Region old = g.Clip;
            using (GraphicsPath p = Draw.Round(fill, 5)) g.SetClip(p);
            int bandW = Math.Max(40, w / 4);
            int x = (int)((w + bandW) * phase) - bandW;
            using (LinearGradientBrush b = new LinearGradientBrush(
                new Rectangle(x, track.Y, bandW, 10),
                Color.FromArgb(0, 255, 255, 255), Color.FromArgb(150, 255, 255, 255), 0f))
            {
                b.SetBlendTriangularShape(0.5f, 1f);
                g.FillRectangle(b, Math.Max(x, 0), track.Y, Math.Min(bandW, w), 10);
            }
            g.Clip = old;
        }
    }

    public void Step()
    {
        phase += 0.025;
        if (phase > 1.4) phase = -0.2;
        Invalidate();
    }
}

/// <summary>玻璃卡片：柔和外投影 + 近白渐变 + 圆角描边 + 顶部高光。</summary>
class GlassCard : Panel
{
    public GlassCard()
    {
        SetStyle(ControlStyles.AllPaintingInWmPaint | ControlStyles.UserPaint
                 | ControlStyles.OptimizedDoubleBuffer | ControlStyles.ResizeRedraw, true);
        BackColor = Color.FromArgb(251, 250, 246);
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        Graphics g = e.Graphics;
        g.Clear(Parent != null ? Parent.BackColor : Ui.Bg);

        Rectangle r = new Rectangle(0, 0, Width - 1, Height - 1);

        // 外投影：多层低透明度叠出柔和边缘
        for (int i = 7; i >= 1; i--)
        {
            using (GraphicsPath sp = Draw.Round(
                new Rectangle(r.X - i, r.Y - i + 3, r.Width + i * 2, r.Height + i * 2), 18 + i))
            using (SolidBrush b = new SolidBrush(Color.FromArgb(3, 20, 22, 15)))
                g.FillPath(b, sp);
        }

        using (GraphicsPath p = Draw.Round(r, 18))
        {
            using (LinearGradientBrush b = new LinearGradientBrush(r,
                Color.FromArgb(255, 253, 253, 251), Color.FromArgb(255, 245, 244, 238), 90f))
                g.FillPath(b, p);
            using (Pen pen = new Pen(Color.FromArgb(255, 255, 255, 255), 1.2f))
                g.DrawPath(pen, p);
        }

        using (Pen pen = new Pen(Color.FromArgb(170, 255, 255, 255), 1f))
            g.DrawLine(pen, 18f, 1.6f, Width - 18f, 1.6f);
    }
}

/* ==================== 向导 ==================== */

class SetupForm : Form
{
    const int W = 760, H = 560;

    readonly Panel content = new Panel();
    readonly Label stepLabel = new Label();
    readonly GlassCard glass = new GlassCard();
    readonly PillButton primary = new PillButton();
    readonly PillButton secondary = new PillButton();
    readonly PillButton cancel = new PillButton();

    readonly TextBox pathBox = new TextBox();
    readonly PillButton browse = new PillButton();
    readonly ProgressLine bar = new ProgressLine();
    readonly Label progressText = new Label();
    readonly CheckBox runNow = new CheckBox();

    float k = 1f;          // DPI 缩放系数
    int step = 1;
    int contentBaseTop;
    string target = "";
    bool pathConfirmed;
    bool copyDone;
    bool optDesktop = true;
    bool optStartMenu = true;
    bool optStartup = false;   // 默认不勾：装机后不写开机启动，需要时在设置里打开
    Label hint;
    CheckBox chkDesktop, chkStartMenu, chkStartup;
    bool copying;
    WinTimer shimmer;

    public SetupForm()
    {
        Text = Meta.TITLE;
        FormBorderStyle = FormBorderStyle.None;
        StartPosition = FormStartPosition.CenterScreen;
        // 用真实屏幕 DPI 算缩放；DeviceDpi 在无边框窗未创建时不可靠
        try { using (Graphics g = CreateGraphics()) k = g.DpiX / 96f; }
        catch (Exception) { k = 1f; }
        if (k < 1f) k = 1f;
        ClientSize = new Size(S(W), S(H));
        BackColor = Ui.Bg;
        DoubleBuffered = true;
        Font = Ui.F(9.5f, false);
        Opacity = 0;

        try { Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); }
        catch (Exception) { }

        BuildChrome();
        ScaleKids(this, k);

        ShowStep(1);
        AnimateIn();
    }

    protected override CreateParams CreateParams
    {
        get
        {
            CreateParams cp = base.CreateParams;
            cp.ClassStyle |= 0x20000;
            return cp;
        }
    }

    protected override void OnResize(EventArgs e)
    {
        base.OnResize(e);
        using (GraphicsPath p = Draw.Round(new Rectangle(0, 0, Width, Height), 16))
            Region = new Region(p);
    }

    /* DPI 缩放下 StartPosition=CenterScreen 会偏，显示后自己算一次屏幕正中 */
    protected override void OnShown(EventArgs e)
    {
        base.OnShown(e);
        try
        {
            Rectangle wa = Screen.FromPoint(Cursor.Position).WorkingArea;
            Location = new Point(wa.X + (wa.Width - Width) / 2, wa.Y + (wa.Height - Height) / 2);
        }
        catch (Exception) { }
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        base.OnPaint(e);
        using (LinearGradientBrush b = new LinearGradientBrush(
            new Rectangle(0, 0, Width, 4), Ui.Acc, Ui.Bg, 90f))
            e.Graphics.FillRectangle(b, 0, 0, Width, 4);
        // 右上角一团极淡的主色光，和应用首页的调子一致
        using (GraphicsPath gp = new GraphicsPath())
        {
            gp.AddEllipse(Width - (int)(260 * k), -(int)(150 * k), (int)(420 * k), (int)(420 * k));
            using (PathGradientBrush b = new PathGradientBrush(gp))
            {
                b.CenterColor = Color.FromArgb(40, 198, 242, 76);
                b.SurroundColors = new Color[] { Color.FromArgb(0, 198, 242, 76) };
                e.Graphics.FillPath(b, gp);
            }
        }
        using (Pen p = new Pen(Ui.Line, 1))
            e.Graphics.DrawRectangle(p, 0, 0, Width - 1, Height - 1);
    }

    /* ---------- 骨架 ---------- */

    Point drag;

    void BuildChrome()
    {
        Label mark = new Label();
        mark.Text = "●  Zingdex";
        mark.ForeColor = Ui.AccDeep;
        mark.Font = Ui.F(9.5f, true);
        mark.BackColor = Color.Transparent;
        mark.SetBounds(30, 28, 220, 22);
        mark.MouseDown += Down;
        mark.MouseMove += Move2;
        Controls.Add(mark);

        Label ver = new Label();
        ver.Text = "v" + Meta.VER;
        ver.ForeColor = Ui.Ink3;
        ver.Font = Ui.F(9f, false);
        ver.BackColor = Color.Transparent;
        ver.SetBounds(148, 30, 120, 20);
        Controls.Add(ver);

        stepLabel.Text = "1 / 4";
        stepLabel.ForeColor = Ui.Ink3;
        stepLabel.Font = new Font("Consolas", 9.5f);
        stepLabel.TextAlign = ContentAlignment.MiddleRight;
        stepLabel.BackColor = Color.Transparent;
        stepLabel.SetBounds(W - 148, 28, 60, 22);
        Controls.Add(stepLabel);

        Label close = new Label();
        close.Text = "✕";
        close.ForeColor = Ui.Ink3;
        close.Font = new Font("Segoe UI", 11f);
        close.TextAlign = ContentAlignment.MiddleCenter;
        close.SetBounds(W - 52, 24, 32, 32);
        close.Cursor = Cursors.Hand;
        close.Click += (s, e) => Quit();
        Controls.Add(close);

        glass.SetBounds(16, 66, W - 32, H - 92);
        Controls.Add(glass);

        content.SetBounds(24, 20, W - 64, 360);
        content.BackColor = glass.BackColor;
        glass.Controls.Add(content);

        cancel.Text = "取消";
        cancel.Primary = false;
        cancel.Soft = true;
        cancel.SetBounds(24, H - 92 - 64, 96, 44);
        cancel.Click += (s, e) => Quit();
        glass.Controls.Add(cancel);

        secondary.Text = "上一步";
        secondary.Primary = false;
        secondary.SetBounds(W - 32 - 300, H - 92 - 64, 116, 44);
        secondary.Click += (s, e) => Back();
        glass.Controls.Add(secondary);

        primary.Text = "开始安装";
        primary.SetBounds(W - 32 - 164, H - 92 - 64, 132, 44);
        primary.Click += (s, e) => Next();
        glass.Controls.Add(primary);

        MouseDown += Down;
        MouseMove += Move2;
    }

    int S(int v) { return (int)Math.Round(v * k); }

    /// <summary>按 DPI 系数把控件矩形等比放大，文字才不会糊、间距才不会挤。</summary>
    static void ScaleKids(Control parent, float k)
    {
        if (Math.Abs(k - 1f) < 0.01f) return;
        foreach (Control c in parent.Controls)
        {
            c.SetBounds((int)Math.Round(c.Left * k), (int)Math.Round(c.Top * k),
                        (int)Math.Round(c.Width * k), (int)Math.Round(c.Height * k));
            ScaleKids(c, k);
        }
    }

    void Down(object s, MouseEventArgs e) { drag = e.Location; }
    void Move2(object s, MouseEventArgs e)
    {
        if (e.Button == MouseButtons.Left)
            Location = new Point(Location.X + e.X - drag.X, Location.Y + e.Y - drag.Y);
    }

    /* ---------- 入场 ---------- */

    void AnimateIn()
    {
        int y0 = Top;
        Anim.Run(220, v =>
        {
            Opacity = v;
            Top = (int)(y0 + 14 * (1 - v));
        }, null);
    }

    /* ---------- 步骤 ---------- */

    void ShowStep(int n)
    {
        step = n;
        stepLabel.Text = Math.Min(3, n) + " / 3";
        content.Controls.Clear();

        if (n == 1) DrawWelcome();
        else if (n == 2) DrawPath();
        else DrawProgress();

        primary.Visible = n <= 2 || copyDone;
        secondary.Visible = n == 2 && !pathConfirmed;
        cancel.Visible = !copyDone;

        if (n == 1) primary.Text = "开始安装";
        if (n == 2) primary.Text = pathConfirmed ? "确定" : "下一步";
        if (n == 3) primary.Text = "完成";

        ScaleKids(content, k);

        contentBaseTop = content.Top;
        content.Top = contentBaseTop + 14;
        Anim.Run(200, v => { content.Top = (int)(contentBaseTop + 14 * (1 - v)); }, null);
    }

    Label Lbl(string text, Font f, Color c, int x, int y, int w, int h)
    {
        Label l = new Label();
        l.Text = text;
        l.Font = f;
        l.ForeColor = c;
        l.BackColor = Color.Transparent;
        l.SetBounds(x, y, w, h);
        content.Controls.Add(l);
        return l;
    }

    void DrawWelcome()
    {
        Lbl("跃索  ·  动效组件库", Ui.F(26f, true), Ui.Ink, 0, 10, 520, 44);
        Lbl("Zingdex   v" + Meta.VER + "　·　" + Meta.COUNT + " 个动效组件　·　完全离线",
            Ui.F(10f, false), Ui.Ink2, 2, 58, 600, 24);

        Panel rule = new Panel();
        rule.BackColor = Ui.Line;
        rule.SetBounds(0, 104, W - 78, 1);
        content.Controls.Add(rule);

        string[] pts = {
            "自带浏览器内核，不依赖系统 Edge 或其他软件",
            "所有组件、文档、资源随包内置，断网可用",
            "不注册、不联网、不上传任何数据",
            "安装位置自己选，程序数据都放在安装目录里，卸载时一起清掉"
        };
        for (int i = 0; i < pts.Length; i++)
            Lbl("· " + pts[i], Ui.F(10.5f, false), Ui.Ink2, 2, 130 + i * 34, 640, 26);

        Panel rule2 = new Panel();
        rule2.BackColor = Ui.Line;
        rule2.SetBounds(0, 292, W - 78, 1);
        content.Controls.Add(rule2);

        Lbl("点右下角「开始安装」，下一步选择安装位置；随时可以取消。",
            Ui.F(9.5f, false), Ui.Ink3, 2, 312, 640, 22);

        string[] prev = Installer.Installed();
        if (prev != null)
        {
            Lbl("已检测到本机安装过 v" + prev[0] + "，继续安装会覆盖更新，原有数据保留。",
                Ui.F(9.5f, false), Ui.AccDeep, 2, 338, 640, 22);
        }
    }

    void DrawPath()
    {
        Lbl("安装位置", Ui.F(17f, true), Ui.Ink, 0, 0, 400, 32);
        Lbl("没有默认路径，请点右侧「浏览」选择文件夹。", Ui.F(9.5f, false), Ui.Ink2, 2, 36, 520, 22);

        Panel frame = new Panel();
        frame.BackColor = Ui.Card;
        frame.SetBounds(0, 76, 440, 46);
        frame.Paint += (s, e) =>
        {
            Draw.Stroke(e.Graphics, new Rectangle(0, 0, frame.Width - 1, frame.Height - 1),
                12, Ui.Line, 1.2f);
        };
        content.Controls.Add(frame);

        pathBox.Text = target ?? "";
        pathBox.Visible = true;
        pathBox.BorderStyle = BorderStyle.None;
        pathBox.BackColor = Ui.Card;
        pathBox.ForeColor = Ui.Ink;
        pathBox.Font = new Font("Consolas", 10f);
        pathBox.SetBounds(14, 12, 410, 22);
        frame.Controls.Add(pathBox);

        browse.Text = "浏览…";
        browse.Primary = false;
        browse.SetBounds(456, 76, 96, 46);
        browse.Click += (s, e) => PickFolder();
        content.Controls.Add(browse);

        Lbl("需要约 300 MB 可用空间。", Ui.F(9f, false), Ui.Ink3, 2, 134, 540, 22);
        Lbl("卸载在「设置 → 应用」里，可以随时完整移除。",
            Ui.F(9f, false), Ui.Ink3, 2, 158, 640, 22);

        hint = Lbl("点「下一步」会把路径复制到剪贴板；确认无误再点「确定」。",
            Ui.F(9f, false), Ui.Ink2, 2, 190, 640, 22);

        pathBox.TextChanged += (s, e) =>
        {
            if (pathConfirmed)
            {
                pathConfirmed = false;
                primary.Text = "下一步";
                hint.Text = "点「下一步」会把路径复制到剪贴板；确认无误再点「确定」。";
            }
        };
    }

    void DrawOptions()
    {
        Lbl("常用功能项", Ui.F(17f, true), Ui.Ink, 0, 0, 400, 32);
        Lbl("按需要勾选，不需要可以全部取消。", Ui.F(9.5f, false), Ui.Ink2, 2, 36, 640, 22);

        chkDesktop = Opt("桌面快捷方式", 78);
        chkStartMenu = Opt("开始菜单快捷方式", 118);
        chkStartup = Opt("开机自动启动", 158);

        chkDesktop.Checked = optDesktop;
        chkStartMenu.Checked = optStartMenu;
        chkStartup.Checked = optStartup;

        Lbl("不会弹权限窗口，也不需要管理员身份。", Ui.F(9f, false), Ui.Ink3, 2, 204, 640, 22);
    }

    CheckBox Opt(string text, int y)
    {
        CheckBox c = new CheckBox();
        c.Text = text;
        c.ForeColor = Ui.Ink;
        c.Font = Ui.F(10.5f, false);
        c.BackColor = Color.Transparent;
        c.FlatStyle = FlatStyle.System;
        c.SetBounds(2, y, 380, 26);
        content.Controls.Add(c);
        return c;
    }

    void DrawProgress()
    {
        Lbl("正在安装", Ui.F(18f, true), Ui.Ink, 0, 0, 400, 34);

        progressText.Text = "准备中…";
        progressText.ForeColor = Ui.Ink2;
        progressText.Font = Ui.F(9f, false);
        progressText.BackColor = Color.Transparent;
        progressText.SetBounds(2, 54, 540, 22);
        progressText.Visible = true;
        content.Controls.Add(progressText);

        bar.Set(0);
        bar.SetBounds(0, 84, 552, 24);
        bar.Visible = true;
        content.Controls.Add(bar);

        if (shimmer == null)
        {
            shimmer = new WinTimer();
            shimmer.Interval = 33;
            shimmer.Tick += (s, e) => bar.Step();
        }
        shimmer.Start();
    }

    void DrawDone()
    {
        if (shimmer != null) shimmer.Stop();
        content.Controls.Clear();

        Label ok = Lbl("安装成功", Ui.F(22f, true), Ui.AccDeep, 0, 14, 660, 42);
        ok.TextAlign = ContentAlignment.MiddleCenter;

        // 每一行固定 52px：小标题 9pt 在上，值用等宽字体在下，行与行之间留够，
        // 之前是手工累加 y，数据说明换成三行以后就和「开机启动」叠在一起了
        int y = 74;

        Lbl("桌面快捷方式", Ui.F(9f, false), Ui.Ink3, 2, y, 200, 18);
        Lbl(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory),
            Meta.NAME + ".lnk"), new Font("Consolas", 8.5f), Ui.Ink, 2, y + 17, 650, 18);
        y += 52;

        Lbl("开始菜单快捷方式", Ui.F(9f, false), Ui.Ink3, 2, y, 220, 18);
        Lbl(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs),
            Meta.NAME + ".lnk"), new Font("Consolas", 8.5f), Ui.Ink, 2, y + 17, 650, 18);
        y += 52;

        Lbl("程序位置", Ui.F(9f, false), Ui.Ink3, 2, y, 200, 18);
        Lbl(target, new Font("Consolas", 8.5f), Ui.Ink, 2, y + 17, 650, 18);
        y += 52;

        Lbl("数据存放", Ui.F(9f, false), Ui.Ink3, 2, y, 200, 18);
        Lbl("全部数据（设置、授权、缓存）都保存在安装目录下的 data 文件夹里，不往系统其他地方写；"
            + "卸载时会连这个目录一起删掉。",
            Ui.F(9f, false), Ui.Ink2, 2, y + 17, 650, 34);
        y += 62;

        Lbl("开机启动", Ui.F(9f, false), Ui.Ink3, 2, y, 200, 18);
        Lbl("已添加。不需要的话，可在「任务管理器 → 启动」里关掉。",
            Ui.F(9f, false), Ui.Ink2, 2, y + 17, 650, 20);
        y += 46;

        runNow.Text = "立即运行 Zingdex";
        runNow.ForeColor = Ui.Ink2;
        runNow.Font = Ui.F(9.5f, false);
        runNow.BackColor = Color.Transparent;
        runNow.Checked = true;
        runNow.SetBounds(2, y, 300, 24);
        runNow.Visible = true;
        content.Controls.Add(runNow);

        ScaleKids(content, k);
        primary.Visible = true;
        primary.Text = "完成";
        secondary.Visible = false;
        cancel.Visible = false;
        stepLabel.Text = "3 / 3";
    }

    /* ---------- 交互 ---------- */

    void PickFolder()
    {
        using (FolderBrowserDialog d = new FolderBrowserDialog())
        {
            d.Description = "选择安装位置";
            if (!string.IsNullOrEmpty(target))
                d.SelectedPath = Directory.Exists(target) ? target : Path.GetDirectoryName(target);
            if (d.ShowDialog(this) == DialogResult.OK)
                target = Path.Combine(d.SelectedPath, Meta.NAME);
        }
        pathBox.Text = target;
    }

    void Quit()
    {
        if (copying)
        {
            if (MessageBox.Show(this, "正在安装，确定要中止吗？", Meta.TITLE,
                MessageBoxButtons.OKCancel, MessageBoxIcon.Warning) != DialogResult.OK)
                return;
        }
        Anim.Run(160, v => { Opacity = 1 - v; }, Close);
    }

    void Back()
    {
        if (step == 2) { pathConfirmed = false; ShowStep(1); }
    }

    void Next()
    {
        if (step == 1)
        {
            string[] prev = Installer.Installed();
            if (prev != null)
            {
                string ask = "检测到本机已安装 v" + prev[0] + "：\n" + prev[1] +
                    "\n\n是否覆盖该版本继续安装？\n\n" +
                    "是：直接覆盖安装到原路径（设置与授权保留）\n否：退出安装";
                if (MessageBox.Show(this, ask, Meta.TITLE, MessageBoxButtons.YesNo,
                        MessageBoxIcon.Question) != DialogResult.Yes)
                {
                    // 选「否」= 不更新，整个安装程序退出
                    Close();
                    Application.Exit();
                    return;
                }

                // 选「是」= 覆盖更新，跳过路径选择，直接用原路径开装
                if (Directory.Exists(prev[1]))
                {
                    target = prev[1];
                    pathBox.Text = target;
                    pathConfirmed = true;
                    copyDone = false;
                    ShowStep(3);
                    StartCopy();
                    return;
                }
            }
            ShowStep(2);
            return;
        }

        if (step == 2)
        {
            string p = pathBox.Text.Trim();
            if (p.Length < 4 || p.IndexOf(':') < 1)
            {
                MessageBox.Show(this,
                    "请先选择安装位置。\n\n本安装程序不设默认路径，必须由你指定一个文件夹。",
                    Meta.TITLE, MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }
            target = p;

            if (!pathConfirmed)
            {
                // 已经装过就按「更新」处理：数据目录保留，只替换程序文件
                bool isUpdate = File.Exists(Path.Combine(target, "Zingdex.exe"));
                if (!isUpdate && Directory.Exists(target) && Directory.GetFileSystemEntries(target).Length > 0)
            {
                    if (MessageBox.Show(this,
                        "这个文件夹不是空的。\n\n继续安装会覆盖同名文件，确定吗？",
                        Meta.TITLE, MessageBoxButtons.OKCancel, MessageBoxIcon.Warning) != DialogResult.OK)
                        return;
                }
                bool copied = false;
                try { Clipboard.SetText(target); copied = true; }
                catch (Exception) { }
                pathConfirmed = true;
                primary.Text = "确定";
                if (hint != null)
                    hint.Text = copied
                        ? "已复制到剪贴板 · 确认无误后点「确定」"
                        : "确认无误后点「确定」";
                return;
            }

            copyDone = false;
            ShowStep(3);
            StartCopy();
            return;
        }

        if (step == 3)
        {
            if (!copyDone) return;
            if (runNow.Checked)
            {
                try { Process.Start(Path.Combine(target, "Zingdex.exe")); }
                catch (Exception) { }
            }
            Close();
        }
    }

    /* ---------- 复制 ---------- */

    void StartCopy()
    {
        copying = true;
        Thread t = new Thread(DoCopy);
        t.IsBackground = true;
        t.Start();
    }

    void DoCopy()
    {
        try
        {
            string to = target;
            Directory.CreateDirectory(to);

            // 覆盖安装时程序可能正在运行，先请它退出，避免文件被占用
            try
            {
                Process[] running = Process.GetProcessesByName("Zingdex");
                foreach (Process p in running)
                {
                    try { p.Kill(); p.WaitForExit(3000); } catch (Exception) { }
                }
                if (running.Length > 0) Thread.Sleep(400);
            }
            catch (Exception) { }

            Stream zip = Installer.Payload();
            if (zip != null)
            {
                using (zip)
                using (ZipArchive arc = new ZipArchive(zip, ZipArchiveMode.Read))
                {
                    long total = 0, done = 0;
                    foreach (ZipArchiveEntry z in arc.Entries) total += z.Length + 1;
                    foreach (ZipArchiveEntry e in arc.Entries)
                    {
                        string rel = e.FullName.Replace('/', Path.DirectorySeparatorChar);
                        string dst = Path.Combine(to, rel);
                        if (string.IsNullOrEmpty(e.Name))
                        {
                            Directory.CreateDirectory(dst);
                        }
                        else
                        {
                            string dir = Path.GetDirectoryName(dst);
                            if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
                            e.ExtractToFile(dst, true);
                        }
                        done += e.Length + 1;
                        string show = rel;
                        if (show.Length > 56) show = "…" + show.Substring(show.Length - 54);
                        SetProgress(done, total, show);
                    }
                }
            }
            else
            {
                string from = Installer.SourceDir;
                string[] files = Directory.GetFiles(from, "*", SearchOption.AllDirectories);
                int total = files.Length, done = 0;
                foreach (string f in files)
                {
                    string rel = f.Substring(from.Length).TrimStart(Path.DirectorySeparatorChar);
                    string dst = Path.Combine(to, rel);
                    string dir = Path.GetDirectoryName(dst);
                    if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
                    File.Copy(f, dst, true);
                    done++;
                    SetProgress(done, total, rel);
                }
            }

            Installer.CopySelf(Path.Combine(to, "Uninstall.exe"));
            Installer.WriteUninstallEntry(to);
            if (optDesktop || optStartMenu)
                Installer.MakeShortcuts(to, optDesktop, optStartMenu);
            Installer.SetStartup(to, optStartup);

            Invoke((MethodInvoker)delegate
            {
                copying = false;
                copyDone = true;
                DrawDone();
            });
        }
        catch (Exception ex)
        {
            Invoke((MethodInvoker)delegate
            {
                copying = false;
                MessageBox.Show(this, "安装失败：\n" + ex.Message, Meta.TITLE, MessageBoxButtons.OK, MessageBoxIcon.Error);
                ShowStep(2);
            });
        }
    }

    void SetProgress(long done, long total, string text)
    {
        try
        {
            Invoke((MethodInvoker)delegate
            {
                bar.Set(total > 0 ? done / (double)total : 0);
                progressText.Text = Human(done) + " / " + Human(total) + "　" + text;
            });
        }
        catch (Exception) { }
    }

    static string Human(long n)
    {
        if (n >= 1073741824L) return (n / 1073741824.0).ToString("0.0") + " GB";
        if (n >= 1048576L) return (n / 1048576.0).ToString("0.0") + " MB";
        if (n >= 1024L) return (n / 1024.0).ToString("0") + " KB";
        return n.ToString();
    }

    void SetProgress(int done, int total, string text)
    {
        SetProgress((long)done, (long)total, text);
    }

    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        if (shimmer != null) shimmer.Stop();
        base.OnFormClosing(e);
    }
}

/* ==================== 安装动作 ==================== */

static class Installer
{
    static readonly byte[] MAGIC = Encoding.ASCII.GetBytes("TRSPAY1" + (char)0);

    /// <summary>安装包尾部带着的 zip；开发时旁边有 app 目录则返回 null。</summary>
    public static Stream Payload()
    {
        try
        {
            string self = Assembly.GetExecutingAssembly().Location;
            FileStream fs = new FileStream(self, FileMode.Open, FileAccess.Read, FileShare.Read);
            if (fs.Length < 40) { fs.Dispose(); return null; }
            byte[] tail = new byte[32];
            fs.Seek(-32, SeekOrigin.End);
            fs.Read(tail, 0, 32);
            for (int i = 0; i < 8; i++)
                if (tail[i] != MAGIC[i]) { fs.Dispose(); return null; }
            long off = BitConverter.ToInt64(tail, 8);
            long len = BitConverter.ToInt64(tail, 16);
            if (off <= 0 || len <= 0 || off + len > fs.Length) { fs.Dispose(); return null; }
            return new SubStream(fs, off, len);
        }
        catch (Exception) { return null; }
    }

    public static string SourceDir
    {
        get { return Path.Combine(Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location), "app"); }
    }

    public static void CopySelf(string dst)
    {
        string self = Assembly.GetExecutingAssembly().Location;
        long len = new FileInfo(self).Length;
        using (FileStream src = new FileStream(self, FileMode.Open, FileAccess.Read, FileShare.Read))
        {
            byte[] tail = new byte[32];
            if (len > 40)
            {
                src.Seek(-32, SeekOrigin.End);
                src.Read(tail, 0, 32);
                bool hit = true;
                for (int i = 0; i < 8; i++) if (tail[i] != MAGIC[i]) { hit = false; break; }
                if (hit)
                {
                    long off = BitConverter.ToInt64(tail, 8);
                    if (off > 0 && off < len) len = off;
                }
                src.Seek(0, SeekOrigin.Begin);
            }
            using (FileStream dstf = new FileStream(dst, FileMode.Create, FileAccess.Write))
            {
                byte[] buf = new byte[1 << 20];
                long left = len;
                while (left > 0)
                {
                    int n = src.Read(buf, 0, (int)Math.Min(buf.Length, left));
                    if (n <= 0) break;
                    dstf.Write(buf, 0, n);
                    left -= n;
                }
            }
        }
    }

    public static string DefaultTarget
    {
        get
        {
            string local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            return Path.Combine(Path.Combine(local, "Programs"), Meta.NAME);
        }
    }

    public static void CopyTree(string from, string to)
    {
        foreach (string dir in Directory.GetDirectories(from, "*", SearchOption.AllDirectories))
            Directory.CreateDirectory(dir.Replace(from, to));
        foreach (string f in Directory.GetFiles(from, "*", SearchOption.AllDirectories))
        {
            string dst = f.Replace(from, to);
            string d = Path.GetDirectoryName(dst);
            if (!Directory.Exists(d)) Directory.CreateDirectory(d);
            File.Copy(f, dst, true);
        }
    }

    public static void MakeShortcuts(string target, bool withDesktop, bool withStartMenu)
    {
        string exe = Path.Combine(target, "Zingdex.exe");
        if (withStartMenu)
            MakeShortcut(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs),
                Meta.NAME + ".lnk"), exe);
        if (withDesktop)
            MakeShortcut(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory),
                Meta.NAME + ".lnk"), exe);
    }

    /// <summary>HKCU 的 Run 项，不需要管理员权限，也不会弹 UAC。</summary>
    public static void SetStartup(string target, bool on)
    {
        try
        {
            using (RegistryKey k = Registry.CurrentUser.OpenSubKey(
                @"Software\Microsoft\Windows\CurrentVersion\Run", true))
            {
                if (k == null) return;
                if (on)
                    k.SetValue("Zingdex", "\"" + Path.Combine(target, "Zingdex.exe") + "\"");
                else if (k.GetValue("Zingdex") != null)
                    k.DeleteValue("Zingdex", false);
            }
        }
        catch (Exception) { }
    }

    public static void MakeShortcut(string lnk, string exe)
    {
        try
        {
            object shell = Activator.CreateInstance(Type.GetTypeFromProgID("WScript.Shell"));
            object sc = shell.GetType().InvokeMember("CreateShortcut",
                BindingFlags.InvokeMethod, null, shell, new object[] { lnk });
            Type t = sc.GetType();
            t.InvokeMember("TargetPath", BindingFlags.SetProperty, null, sc, new object[] { exe });
            t.InvokeMember("WorkingDirectory", BindingFlags.SetProperty, null, sc,
                new object[] { Path.GetDirectoryName(exe) });
            t.InvokeMember("IconLocation", BindingFlags.SetProperty, null, sc, new object[] { exe });
            t.InvokeMember("Description", BindingFlags.SetProperty, null, sc, new object[] { Meta.TITLE });
            t.InvokeMember("Save", BindingFlags.InvokeMethod, null, sc, null);
        }
        catch (Exception) { }
    }

    public static void WriteUninstallEntry(string target)
    {
        try
        {
            using (RegistryKey k = Registry.CurrentUser.CreateSubKey(
                @"Software\Microsoft\Windows\CurrentVersion\Uninstall\Zingdex"))
            {
                k.SetValue("DisplayName", Meta.TITLE);
                k.SetValue("DisplayVersion", Meta.VER);
                k.SetValue("Publisher", "跃索相关团队");
                k.SetValue("InstallLocation", target);
                k.SetValue("DisplayIcon", Path.Combine(target, "Zingdex.exe"));
                k.SetValue("UninstallString", "\"" + Path.Combine(target, "Uninstall.exe") + "\" --uninstall");
                k.SetValue("NoModify", 1, RegistryValueKind.DWord);
                k.SetValue("NoRepair", 1, RegistryValueKind.DWord);
            }
        }
        catch (Exception) { }
    }

    /// <summary>读注册表里上一次安装的版本与位置；没装过返回 null。</summary>
    public static string[] Installed()
    {
        try
        {
            using (RegistryKey k = Registry.CurrentUser.OpenSubKey(
                @"Software\Microsoft\Windows\CurrentVersion\Uninstall\Zingdex"))
            {
                if (k == null) return null;
                string ver = (k.GetValue("DisplayVersion") as string) ?? "";
                string loc = (k.GetValue("InstallLocation") as string) ?? "";
                if (string.IsNullOrEmpty(loc)) return null;
                return new string[] { ver, loc };
            }
        }
        catch (Exception) { return null; }
    }

    public static int Silent(string[] args)
    {
        string target = null;
        foreach (string a in args)
            if (a.StartsWith("--target=")) target = a.Substring("--target=".Length).Trim('"');
        if (string.IsNullOrWhiteSpace(target))
            throw new InvalidOperationException("静默安装必须用 --target= 指定路径");

        Directory.CreateDirectory(target);
        Stream zip = Payload();
        if (zip != null)
        {
            using (zip)
            using (ZipArchive arc = new ZipArchive(zip, ZipArchiveMode.Read))
            {
                foreach (ZipArchiveEntry e in arc.Entries)
                {
                    string dst = Path.Combine(target, e.FullName.Replace('/', Path.DirectorySeparatorChar));
                    if (string.IsNullOrEmpty(e.Name)) Directory.CreateDirectory(dst);
                    else
                    {
                        string dir = Path.GetDirectoryName(dst);
                        if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
                        e.ExtractToFile(dst, true);
                    }
                }
            }
        }
        else
        {
            if (!Directory.Exists(SourceDir))
                throw new InvalidOperationException("安装包不完整：找不到 app 目录");
            CopyTree(SourceDir, target);
        }

        CopySelf(Path.Combine(target, "Uninstall.exe"));
        WriteUninstallEntry(target);
        MakeShortcuts(target, true, true);
        SetStartup(target, true);
        return 0;
    }
}

/* ==================== 卸载 ==================== */

/// <summary>卸载进度窗口：一行标题、一条进度条、一行当前动作。</summary>
class UninstallProgress : Form
{
    readonly ProgressBar bar = new ProgressBar();
    readonly Label step = new Label();
    readonly Label head = new Label();

    public UninstallProgress()
    {
        Text = Meta.TITLE;
        FormBorderStyle = FormBorderStyle.FixedDialog;
        StartPosition = FormStartPosition.CenterScreen;
        MaximizeBox = false;
        MinimizeBox = false;
        ShowInTaskbar = true;
        ClientSize = new Size(460, 170);
        BackColor = Ui.Bg;
        Font = Ui.F(9.5f, false);
        try { Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); }
        catch (Exception) { }

        head.Text = "正在卸载";
        head.Font = Ui.F(15f, true);
        head.ForeColor = Ui.Ink;
        head.AutoSize = false;
        head.SetBounds(26, 22, 400, 30);
        Controls.Add(head);

        bar.SetBounds(26, 66, 408, 18);
        bar.Minimum = 0;
        bar.Maximum = 100;
        Controls.Add(bar);

        step.Text = "准备中…";
        step.ForeColor = Ui.Ink3;
        step.AutoSize = false;
        step.SetBounds(26, 96, 408, 24);
        Controls.Add(step);
    }

    public void Report(int percent, string text)
    {
        try
        {
            bar.Value = Math.Max(0, Math.Min(100, percent));
            step.Text = text;
            bar.Refresh();
            step.Refresh();
            Application.DoEvents();
        }
        catch (Exception) { }
    }
}

static class Uninstaller
{
    public static int Run(string[] args)
    {
        bool silent = Array.IndexOf(args, "--silent") >= 0;

        string dir = null;
        foreach (string a in args)
            if (a.StartsWith("--dir=")) dir = a.Substring("--dir=".Length).Trim('"');

        // 第二阶段：从临时目录运行的清理进程，dir 是要删的安装目录
        if (!string.IsNullOrEmpty(dir)) return Finish(dir, silent);

        string here = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);

        if (!silent)
        {
            string msg = "确定卸载 Zingdex 跃索 · 动效组件库？\n\n安装位置：" + here +
                         "\n\n会一次清除下面这些，一个不留：\n" +
                         "· 程序文件与内置资源\n" +
                         "· 程序数据目录（安装目录下的 data，含设置、授权、缓存）\n" +
                         "· %APPDATA%\\Zingdex 与 %LOCALAPPDATA%\\Zingdex\n" +
                         "· 开机启动项 HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\Zingdex\n" +
                         "· 卸载登记项 HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Zingdex\n" +
                         "· 程序注册键 HKCU\\Software\\Zingdex\n" +
                         "· 桌面与开始菜单里的快捷方式\n\n" +
                         "卸载完成后会显示一份报告。卸载后无法恢复。";
            if (MessageBox.Show(msg, Meta.TITLE, MessageBoxButtons.OKCancel,
                    MessageBoxIcon.Warning) != DialogResult.OK)
                return 0;
        }

        // 复制到临时目录再跑：不然删到一半把自己删了，后面的步骤就执行不下去
        try
        {
            string tmp = Path.Combine(Path.GetTempPath(),
                "Zingdex-uninstall-" + Guid.NewGuid().ToString("N") + ".exe");
            File.Copy(Assembly.GetExecutingAssembly().Location, tmp, true);
            ProcessStartInfo psi = new ProcessStartInfo(tmp);
            psi.Arguments = "--uninstall --dir=\"" + here + "\"" + (silent ? " --silent" : "");
            psi.UseShellExecute = false;
            psi.CreateNoWindow = true;
            Process.Start(psi);
            return 0;
        }
        catch (Exception)
        {
            return Finish(here, silent);
        }
    }

    static int Finish(string dir, bool silent)
    {
        List<string> report = new List<string>();
        UninstallProgress ui = null;
        if (!silent)
        {
            ui = new UninstallProgress();
            ui.Show();
            ui.Refresh();
            Application.DoEvents();
        }

        // 1 结束进程
        if (ui != null) ui.Report(8, "正在关闭正在运行的程序…");
        try
        {
            Process[] ps = Process.GetProcessesByName("Zingdex");
            foreach (Process p in ps)
            {
                try { p.Kill(); p.WaitForExit(3000); } catch (Exception) { }
            }
            report.Add("· 正在运行的程序已关闭");
        }
        catch (Exception) { report.Add("· 结束进程：跳过"); }

        Thread.Sleep(silent ? 200 : 700);

        // 2 快捷方式
        if (ui != null) ui.Report(24, "正在删除桌面与开始菜单快捷方式…");
        bool s1 = TryDelete(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), "Zingdex.lnk"));
        bool s2 = TryDelete(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs), "Zingdex.lnk"));
        report.Add("· 桌面与开始菜单快捷方式：" + ((s1 && s2) ? "已清除" : "有快捷方式没删掉"));

        // 3 注册表
        if (ui != null) ui.Report(40, "正在清理注册表（卸载登记 / 开机启动 / 程序键）…");
        bool k1 = TryTree(@"Software\Microsoft\Windows\CurrentVersion\Uninstall\Zingdex");
        bool k2 = TryValue(@"Software\Microsoft\Windows\CurrentVersion\Run", "Zingdex");
        bool k3 = TryTree(@"Software\Zingdex");
        report.Add("· 注册表（卸载登记 / 开机启动 / 程序键）：" + ((k1 && k2 && k3) ? "已清理" : "有项没删掉"));

        // 4 数据目录
        if (ui != null) ui.Report(58, "正在删除设置、授权与缓存…");
        string roaming = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Zingdex");
        string local = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Zingdex");
        TryDeleteDir(roaming);
        TryDeleteDir(local);
        TryDeleteDir(Path.Combine(dir, "data"));
        report.Add("· 设置、授权、缓存：已清除");

        // 5 程序目录（文件可能还被占用，多试几次）
        if (ui != null) ui.Report(78, "正在删除程序文件…");
        bool okDir = TryDeleteDir(dir);
        report.Add(okDir ? "· 程序目录：已删除" : "· 程序目录：有文件正被占用，重启后可手动删除 " + dir);

        // 桌面留一个残留检查脚本，用户随时可以复查并清除遗漏
        try
        {
            string desk = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory),
                "Zingdex 残留检查.bat");
            File.WriteAllText(desk, Meta.CHECK_BAT, new UTF8Encoding(false));
            report.Add("· 桌面已生成「Zingdex 残留检查.bat」，可随时复查");
        }
        catch (Exception) { }

        if (ui != null)
        {
            ui.Report(100, "完成");
            ui.Close();
            ui.Dispose();
        }

        if (!silent)
        {
            string text = "卸载完成\n\n" + string.Join("\n", report.ToArray()) +
                          "\n\n这台电脑上不再保留这个程序的任何数据。";
            MessageBox.Show(text, Meta.TITLE, MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        // 临时目录里的这份自己，交给 cmd 过两秒删掉
        try
        {
            string self = Assembly.GetExecutingAssembly().Location;
            ProcessStartInfo psi = new ProcessStartInfo("cmd.exe");
            psi.Arguments = "/c ping -n 3 127.0.0.1 >nul & del /f /q \"" + self + "\"";
            psi.CreateNoWindow = true;
            psi.UseShellExecute = false;
            Process.Start(psi);
        }
        catch (Exception) { }

        return 0;
    }

    /// <summary>删文件；不存在也算成功。返回 true 表示“现在没有了”。</summary>
    static bool TryDelete(string p)
    {
        try
        {
            if (File.Exists(p)) File.Delete(p);
            return !File.Exists(p);
        }
        catch (Exception) { return false; }
    }

    static bool TryTree(string sub)
    {
        try
        {
            Registry.CurrentUser.DeleteSubKeyTree(sub, false);
            return true;
        }
        catch (Exception) { return false; }
    }

    static bool TryValue(string sub, string name)
    {
        try
        {
            using (RegistryKey k = Registry.CurrentUser.OpenSubKey(sub, true))
            {
                if (k != null && k.GetValue(name) != null) k.DeleteValue(name, false);
            }
            return true;
        }
        catch (Exception) { return false; }
    }

    /// <summary>删目录，带重试：刚被关闭的程序经常还要再等一会儿才放开文件。</summary>
    static bool TryDeleteDir(string path)
    {
        if (string.IsNullOrEmpty(path)) return true;
        for (int i = 0; i < 6; i++)
        {
            try
            {
                if (!Directory.Exists(path)) return true;
                Directory.Delete(path, true);
                return true;
            }
            catch (Exception)
            {
                Thread.Sleep(500);
            }
        }
        try { return !Directory.Exists(path); }
        catch (Exception) { return false; }
    }
}
