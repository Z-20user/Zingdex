# -*- coding: utf-8 -*-
"""把说明用的 Markdown 转成排版好的 HTML，供 Edge 无头打印成 PDF。

用法：python tools/md2html.py 输入.md 输出.html "标题"
"""
import html
import io
import os
import re
import sys


def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r"`([^`]+)`", r"<code>\1</code>", t)
    t = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"!\[([^\]]*)\]\(([^)]+)\)", r'<img src="\2" alt="\1">', t)
    t = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', t)
    return t


def to_body(md):
    lines = md.split("\n")
    out = []
    i = 0
    in_code = False
    list_open = None

    def close_list():
        nonlocal list_open
        if list_open:
            out.append("</%s>" % list_open)
            list_open = None

    while i < len(lines):
        line = lines[i]

        # 代码块
        if line.startswith("```"):
            if in_code:
                out.append("</pre>")
                in_code = False
            else:
                close_list()
                out.append("<pre>")
                in_code = True
            i += 1
            continue
        if in_code:
            out.append(html.escape(line, quote=False))
            i += 1
            continue

        # 表格
        if line.startswith("|") and i + 1 < len(lines) and re.match(r"^\|[\s:\-|]+\|$", lines[i + 1].strip()):
            close_list()
            header = [c.strip() for c in line.strip().strip("|").split("|")]
            out.append("<table><thead><tr>" + "".join("<th>%s</th>" % inline(c) for c in header) + "</tr></thead><tbody>")
            i += 2
            while i < len(lines) and lines[i].startswith("|"):
                cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
                out.append("<tr>" + "".join("<td>%s</td>" % inline(c) for c in cells) + "</tr>")
                i += 1
            out.append("</tbody></table>")
            continue

        # 标题
        m = re.match(r"^(#{1,4})\s+(.*)$", line)
        if m:
            close_list()
            lv = len(m.group(1))
            out.append("<h%d>%s</h%d>" % (lv, inline(m.group(2)), lv))
            i += 1
            continue

        # 分隔线
        if re.match(r"^---+\s*$", line):
            close_list()
            out.append("<hr>")
            i += 1
            continue

        # 引用
        if line.startswith(">"):
            close_list()
            buf = []
            while i < len(lines) and lines[i].startswith(">"):
                buf.append(lines[i].lstrip(">").strip())
                i += 1
            out.append("<blockquote>%s</blockquote>" % inline(" ".join(buf)))
            continue

        # 列表
        m = re.match(r"^(\s*)([-*]|\d+\.)\s+(.*)$", line)
        if m:
            tag = "ol" if m.group(2)[0].isdigit() else "ul"
            if list_open != tag:
                close_list()
                out.append("<%s>" % tag)
                list_open = tag
            out.append("<li>%s</li>" % inline(m.group(3)))
            i += 1
            continue

        if line.strip() == "":
            close_list()
            i += 1
            continue

        # 列表项里的软换行：接着上一项写，而不是另起一段
        if list_open and out and out[-1].endswith("</li>"):
            out[-1] = out[-1][:-5] + " " + inline(line) + "</li>"
            i += 1
            continue

        close_list()
        out.append("<p>%s</p>" % inline(line))
        i += 1

    if in_code:
        out.append("</pre>")
    close_list()

    return chr(10).join(out)


def convert(md, title, contact=""):
    body = to_body(md)

    css = """
    @page { size: A4; margin: 16mm 14mm 16mm 14mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0; color: #1B1F17; background: #FFFFFF;
      font-family: "Microsoft YaHei", "PingFang SC", -apple-system, sans-serif;
      font-size: 10.5pt; line-height: 1.85;
    }
    h1 { font-size: 20pt; margin: 0 0 6pt; letter-spacing: -0.01em; }
    h2 {
      font-size: 13.5pt; margin: 20pt 0 8pt; padding-left: 9pt;
      border-left: 3.5pt solid #C6F24C; line-height: 1.4;
    }
    h3 { font-size: 11.5pt; margin: 14pt 0 5pt; color: #2B3126; }
    p { margin: 0 0 8pt; text-align: justify; }
    ul, ol { margin: 0 0 9pt; padding-left: 16pt; }
    li { margin-bottom: 3pt; }
    blockquote {
      margin: 0 0 10pt; padding: 9pt 12pt; background: #F5F8EC;
      border-left: 3pt solid #9BC22E; color: #2A3122; font-size: 10.5pt;
    }
    blockquote p { margin: 0 0 4pt; }
    table {
      width: 100%; border-collapse: collapse; margin: 8pt 0 12pt;
      font-size: 9.5pt; page-break-inside: avoid;
    }
    th { background: #F1F4E8; text-align: left; font-weight: 600; }
    th, td { border: 0.6pt solid #D8DCCB; padding: 4.5pt 6pt; vertical-align: top; }
    code {
      font-family: Consolas, "Courier New", monospace; font-size: 9.5pt;
      background: #F2F4EE; padding: 0.5pt 3pt; border-radius: 2pt;
    }
    pre {
      background: #F7F8F4; border: 0.6pt solid #E2E5DA; border-radius: 3pt;
      padding: 8pt 10pt; font-size: 9pt; line-height: 1.6; overflow: hidden;
      white-space: pre-wrap; page-break-inside: avoid;
    }
    hr { border: 0; border-top: 0.6pt solid #DFE3D6; margin: 14pt 0; }
    a { color: #3C5200; text-decoration: none; border-bottom: 0.5pt solid #B9CE7A; }
    strong { font-weight: 700; color: #14180F; }
    p > img {
      display: block; width: 150pt; height: auto; margin: 8pt auto 4pt;
      border: 0.6pt solid #D8DCCB; border-radius: 4pt; padding: 5pt; background: #FFFFFF;
    }
    .foot {
      margin-top: 22pt; padding-top: 8pt; border-top: 0.6pt solid #DFE3D6;
      font-size: 8.5pt; color: #7A8070;
    }
    """

    foot = ("<div class=\"foot\">Zingdex 跃索 · 动效组件库　|　"
            "本文档随项目免费分享，不收费、不用于商业用途。")
    if contact:
        foot += ("<br>联系邮箱：" + html.escape(contact) +
                 "　|　有侵权问题请直接联系，核实后立即删除或修改。")
    foot += "</div>"

    return ("<!DOCTYPE html><html lang=\"zh-CN\"><head><meta charset=\"UTF-8\">"
            "<title>%s</title><style>%s</style></head><body>%s"
            + foot +
            "</body></html>") % (html.escape(title), css, body)


if __name__ == "__main__":
    src, dst, title = sys.argv[1], sys.argv[2], (sys.argv[3] if len(sys.argv) > 3 else "文档")
    contact = sys.argv[4] if len(sys.argv) > 4 else ""
    md = io.open(src, encoding="utf-8").read()
    io.open(dst, "w", encoding="utf-8").write(convert(md, title, contact))
    print("html ->", os.path.abspath(dst))
