// Zingdex 跃索 —— 桌面启动器（便携版 / 安装版共用一份源码）
//
// 为什么不带 Electron：整个包有 200 MB 是自带的一份 Chromium。
// 这台机器（以及几乎所有 Win10/11）本来就装了 Edge，直接用它渲染，
// 于是包体从 300 MB 掉到几 MB。
//
// 编译：csc /target:winexe /resource:site.zip,site.zip launcher.cs
// 安装版额外加 /define:INSTALLER

using System;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Windows.Forms;
using Microsoft.Win32;

[assembly: AssemblyTitle("Zingdex 跃索 · 动效组件库")]
[assembly: AssemblyProduct("Zingdex 跃索 · 动效组件库")]
[assembly: AssemblyCompany("跃索相关团队")]
[assembly: AssemblyCopyright("2026 Zingdex")]
[assembly: AssemblyVersion("@VER4@")]
[assembly: AssemblyFileVersion("@VER4@")]

static class Program
{
    const string NAME = "Zingdex";
    const string TITLE = "Zingdex 跃索 · 动效组件库";
    const string VER = "@VER@";
    const string RES = "site.zip";
    const string APP_ID = "Zingdex";

    [STAThread]
    static int Main(string[] args)
    {
        Application.EnableVisualStyles();
        try
        {
#if INSTALLER
            // 直接双击 Uninstall.exe 也要能卸载，不能默认成"再装一次"
            string selfName = Path.GetFileNameWithoutExtension(Assembly.GetExecutingAssembly().Location);
            bool byName = string.Equals(selfName, "Uninstall", StringComparison.OrdinalIgnoreCase);
            if (byName || (args.Length > 0 && args[0] == "--uninstall")) return Uninstall(args);
#endif
            return Run(args);
        }
        catch (Exception ex)
        {
            MessageBox.Show("启动失败：\n" + ex.Message, TITLE, MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 1;
        }
    }

    /* ---------------- 日志 ---------------- */

    static string LogPath
    {
        get { return Path.Combine(Path.Combine(LocalApp, NAME), "launcher.log"); }
    }

    static void Log(string msg)
    {
        try
        {
            Directory.CreateDirectory(Path.Combine(LocalApp, NAME));
            File.AppendAllText(LogPath,
                DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + "  v" + VER + "  " + msg + Environment.NewLine,
                System.Text.Encoding.UTF8);
        }
        catch (Exception) { }
    }

    /* ---------------- 路径 ---------------- */

    static string LocalApp
    {
        get { return Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData); }
    }

    static string ProfileDir
    {
        get { return Path.Combine(Path.Combine(LocalApp, NAME), "profile"); }
    }

    static string SiteDir()
    {
#if INSTALLER
        return Path.Combine(InstallRoot(), "app");
#else
        // 便携版按版本分目录：升级后旧版本目录会被清掉
        return Path.Combine(Path.Combine(Path.Combine(LocalApp, NAME), "app"), VER);
#endif
    }

    static string InstallRoot()
    {
        return Path.Combine(Path.Combine(LocalApp, "Programs"), NAME);
    }

    /* ---------------- 主流程 ---------------- */

    static int Run(string[] args)
    {
#if INSTALLER
        string root = InstallRoot();
        bool firstTime = !File.Exists(Path.Combine(root, "Uninstall.exe"));

        bool silent = Array.IndexOf(args, "--silent") >= 0;

        if (firstTime && !silent)
        {
            string msg = "即将安装 " + TITLE + " " + VER + "\n\n" +
                         "安装位置：\n" + root + "\n\n" +
                         "会创建桌面与开始菜单快捷方式，可在「设置 → 应用」中卸载。";
            if (MessageBox.Show(msg, TITLE, MessageBoxButtons.OKCancel, MessageBoxIcon.Information) != DialogResult.OK)
                return 0;
        }
#endif
        string dir = SiteDir();
        EnsureSite(dir);

        string index = Path.Combine(dir, "index.html");
        if (!File.Exists(index))
        {
            MessageBox.Show("资源解压失败，找不到 index.html。", TITLE, MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 2;
        }

#if INSTALLER
        InstallShortcuts(root);
#endif
        return Launch(index);
    }

    /* 解压站点：只在版本不一致或文件缺失时做，装过一次之后启动是瞬时的 */
    static void EnsureSite(string dir)
    {
        string marker = Path.Combine(dir, ".ver");
        if (File.Exists(marker) && File.Exists(Path.Combine(dir, "index.html")))
        {
            try { if (File.ReadAllText(marker).Trim() == VER) return; } catch (Exception) { }
        }

#if !INSTALLER
        CleanOldVersions(dir);
#endif

        if (Directory.Exists(dir)) Directory.Delete(dir, true);
        Directory.CreateDirectory(dir);

        Assembly asm = Assembly.GetExecutingAssembly();
        using (Stream s = asm.GetManifestResourceStream(RES))
        {
            if (s == null) throw new InvalidOperationException("安装包内缺少站点资源");
            using (ZipArchive zip = new ZipArchive(s, ZipArchiveMode.Read))
            {
                zip.ExtractToDirectory(dir);
            }
        }
        File.WriteAllText(marker, VER, System.Text.Encoding.UTF8);
    }

    static void CleanOldVersions(string keep)
    {
        try
        {
            string parent = Path.GetDirectoryName(keep);
            if (!Directory.Exists(parent)) return;
            foreach (string d in Directory.GetDirectories(parent))
            {
                if (string.Equals(Path.GetFullPath(d), Path.GetFullPath(keep), StringComparison.OrdinalIgnoreCase)) continue;
                try { Directory.Delete(d, true); } catch (Exception) { }
            }
        }
        catch (Exception) { }
    }

    /* ---------------- 启动 ---------------- */

    static int Launch(string index)
    {
        Directory.CreateDirectory(ProfileDir);
        string url = new Uri(index).AbsoluteUri;
        string edge = FindEdge();

        Log("profile=" + ProfileDir + "  edge=" + (edge == null ? "(未找到)" : edge));
        if (edge != null)
        {
            ProcessStartInfo psi = new ProcessStartInfo(edge);
            psi.Arguments =
                "--app=\"" + url + "\"" +
                " --user-data-dir=\"" + ProfileDir + "\"" +
                " --no-first-run --no-default-browser-check" +
                " --disable-background-mode --disable-features=Translate" +
                " --disk-cache-dir=\"" + Path.Combine(Path.GetDirectoryName(ProfileDir), "cache") + "\"" +
                " --disk-cache-size=16777216 --media-cache-size=4194304" +
                " --window-size=1440,920";
            psi.UseShellExecute = false;
            Log("args=" + psi.Arguments);
            Process p = Process.Start(psi);
            Log("edge pid=" + (p == null ? "(null)" : p.Id.ToString()));
            return 0;
        }

        // 兜底：没有 Edge 就交给系统默认浏览器（少了无边框窗口，功能不缺）
        Log("回退：用系统默认浏览器打开 " + url);
        ProcessStartInfo fallback = new ProcessStartInfo(url);
        fallback.UseShellExecute = true;
        Process.Start(fallback);
        return 0;
    }

    static string FindEdge()
    {
        string[] keys = {
            @"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe",
            @"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe"
        };
        foreach (string key in keys)
        {
            string p = ReadAppPath(Registry.LocalMachine, key);
            if (p != null) return PreferProxy(p);
            p = ReadAppPath(Registry.CurrentUser, key);
            if (p != null) return PreferProxy(p);
        }

        string pf86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
        string pf64 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
        string lad = LocalApp;
        string[] cands = {
            Path.Combine(pf86, @"Microsoft\Edge\Application\msedge.exe"),
            Path.Combine(pf64, @"Microsoft\Edge\Application\msedge.exe"),
            Path.Combine(lad, @"Microsoft\Edge\Application\msedge.exe")
        };
        foreach (string c in cands) if (File.Exists(c)) return PreferProxy(c);
        return null;
    }

    /// <summary>
    /// Edge 已在运行时，直接起 msedge.exe 会被单实例机制接管并立刻退出。
    /// msedge_proxy.exe 是 Edge 自己用来开「应用窗口」的入口，能绕开这个问题。
    /// </summary>
    static string PreferProxy(string edgePath)
    {
        try
        {
            string proxy = Path.Combine(Path.GetDirectoryName(edgePath), "msedge_proxy.exe");
            if (File.Exists(proxy)) return proxy;
        }
        catch (Exception) { }
        return edgePath;
    }

    static string ReadAppPath(RegistryKey root, string key)
    {
        try
        {
            using (RegistryKey rk = root.OpenSubKey(key))
            {
                if (rk == null) return null;
                string p = rk.GetValue(null) as string;
                if (!string.IsNullOrEmpty(p) && File.Exists(p)) return p;
            }
        }
        catch (Exception) { }
        return null;
    }

    /* ---------------- 安装 / 卸载（仅安装版编译进来） ---------------- */

#if INSTALLER
    static void InstallShortcuts(string root)
    {
        string exe = Path.Combine(root, "Zingdex.exe");
        string self = Assembly.GetExecutingAssembly().Location;

        try
        {
            if (!string.Equals(Path.GetFullPath(exe), Path.GetFullPath(self), StringComparison.OrdinalIgnoreCase))
                File.Copy(self, exe, true);
            File.Copy(self, Path.Combine(root, "Uninstall.exe"), true);
        }
        catch (Exception) { }   // 正在运行的 exe 覆盖不了，忽略即可

        string desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
        string startMenu = Environment.GetFolderPath(Environment.SpecialFolder.Programs);
        MakeShortcut(Path.Combine(desktop, NAME + ".lnk"), exe, "", exe);
        MakeShortcut(Path.Combine(startMenu, NAME + ".lnk"), exe, "", exe);

        try
        {
            using (RegistryKey k = Registry.CurrentUser.CreateSubKey(
                @"Software\Microsoft\Windows\CurrentVersion\Uninstall\" + APP_ID))
            {
                k.SetValue("DisplayName", TITLE);
                k.SetValue("DisplayVersion", VER);
                k.SetValue("Publisher", "跃索相关团队");
                k.SetValue("InstallLocation", root);
                k.SetValue("DisplayIcon", exe);
                k.SetValue("UninstallString", "\"" + Path.Combine(root, "Uninstall.exe") + "\" --uninstall");
                k.SetValue("NoModify", 1, RegistryValueKind.DWord);
                k.SetValue("NoRepair", 1, RegistryValueKind.DWord);
            }
        }
        catch (Exception) { }
    }

    static void MakeShortcut(string lnk, string target, string args, string icon)
    {
        try
        {
            object shell = Activator.CreateInstance(Type.GetTypeFromProgID("WScript.Shell"));
            object sc = shell.GetType().InvokeMember("CreateShortcut",
                System.Reflection.BindingFlags.InvokeMethod, null, shell, new object[] { lnk });
            Type t = sc.GetType();
            t.InvokeMember("TargetPath", System.Reflection.BindingFlags.SetProperty, null, sc, new object[] { target });
            t.InvokeMember("Arguments", System.Reflection.BindingFlags.SetProperty, null, sc, new object[] { args });
            t.InvokeMember("WorkingDirectory", System.Reflection.BindingFlags.SetProperty, null, sc, new object[] { Path.GetDirectoryName(target) });
            t.InvokeMember("IconLocation", System.Reflection.BindingFlags.SetProperty, null, sc, new object[] { icon });
            t.InvokeMember("Description", System.Reflection.BindingFlags.SetProperty, null, sc, new object[] { TITLE });
            t.InvokeMember("Save", System.Reflection.BindingFlags.InvokeMethod, null, sc, null);
        }
        catch (Exception) { }
    }

    static int Uninstall(string[] args)
    {
        if (Array.IndexOf(args, "--silent") < 0 && MessageBox.Show("确定卸载 " + TITLE + "？\n\n用户设置与授权信息会一并清除。",
                TITLE, MessageBoxButtons.OKCancel, MessageBoxIcon.Warning) != DialogResult.OK)
            return 0;

        string root = InstallRoot();
        string desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
        string startMenu = Environment.GetFolderPath(Environment.SpecialFolder.Programs);

        TryDelete(Path.Combine(desktop, NAME + ".lnk"));
        TryDelete(Path.Combine(startMenu, NAME + ".lnk"));

        try { Registry.CurrentUser.DeleteSubKeyTree(@"Software\Microsoft\Windows\CurrentVersion\Uninstall\" + APP_ID); }
        catch (Exception) { }

        // 自己正在运行、Edge 刚退出文件还锁着——统一交给 cmd 等两秒后再删
        string dataRoot = Path.Combine(LocalApp, NAME);
        string cmd = "/c timeout /t 2 /nobreak >nul"
            + " & rmdir /s /q \"" + root + "\""
            + " & rmdir /s /q \"" + Path.Combine(dataRoot, "profile") + "\""
            + " & rmdir /s /q \"" + Path.Combine(dataRoot, "cache") + "\""
            + " & del /q \"" + Path.Combine(dataRoot, "launcher.log") + "\" >nul 2>nul";
        ProcessStartInfo psi = new ProcessStartInfo("cmd.exe");
        psi.Arguments = cmd;
        psi.CreateNoWindow = true;
        psi.UseShellExecute = false;
        Process.Start(psi);
        return 0;
    }

    static void TryDelete(string path)
    {
        try { if (File.Exists(path)) File.Delete(path); } catch (Exception) { }
    }
#endif
}
