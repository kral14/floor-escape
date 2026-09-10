import os
import sys
import subprocess
from datetime import datetime

# Windows konsolunda UTF-8 dəstəyi
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

REPO_URL = "https://github.com/kral14/floor-escape.git"
DEFAULT_BRANCH = "main"

def print_step(text):
    print(f"\n\033[96m[➔] {text}\033[0m")

def print_success(text):
    print(f"\033[92m[✔] {text}\033[0m")

def print_warn(text):
    print(f"\033[93m[!] {text}\033[0m")

def print_error(text):
    print(f"\033[91m[✘] {text}\033[0m")

def run_cmd(cmd, check=True, capture=False):
    try:
        if capture:
            res = subprocess.run(cmd, shell=True, check=check, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding='utf-8', errors='replace')
            return res.stdout.strip()
        else:
            res = subprocess.run(cmd, shell=True, check=check)
            return res.returncode == 0
    except subprocess.CalledProcessError as e:
        if check:
            print_error(f"Xəta baş verdi: {cmd}")
            if hasattr(e, 'stderr') and e.stderr:
                print(e.stderr)
            raise e
        return None

def main():
    print("=" * 60)
    print("       FLOOR ESCAPE - GITHUB PUSH SKRİPTİ")
    print(f" Hədəf Repo: {REPO_URL}")
    print("=" * 60)

    # 1. Git quraşdırılıb?
    print_step("Git quraşdırılması yoxlanılır...")
    git_version = run_cmd("git --version", check=False, capture=True)
    if not git_version:
        print_error("Sistemdə 'git' tapılmadı! Zəhmət olmasa Git quraşdırın.")
        sys.exit(1)
    print_success(f"Git tapıldı: {git_version}")

    # 2. Build fayllarını yeniləmək (node build.js)
    if os.path.exists("build.js"):
        print_step("Oyun paketləri yenilənir (node build.js)...")
        run_cmd("node build.js", check=False)

    # 3. .git qovluğu varmı?
    if not os.path.exists(".git"):
        print_step("Git repozitoriyası başladılır (git init)...")
        run_cmd("git init")
        run_cmd(f"git branch -M {DEFAULT_BRANCH}")
        print_success(f"Lokal git repozitoriyası yaradıldı ('{DEFAULT_BRANCH}' filialı).")
    else:
        print_success("Mövcud .git repozitoriyası aşkar edildi.")

    # 4. Remote 'origin' yoxlanışı və tənzimlənməsi
    print_step("Uzaq repozitoriya (remote origin) yoxlanılır...")
    current_remote = run_cmd("git remote get-url origin", check=False, capture=True)
    if not current_remote:
        run_cmd(f"git remote add origin {REPO_URL}")
        print_success(f"Remote 'origin' əlavə edildi: {REPO_URL}")
    elif current_remote != REPO_URL:
        run_cmd(f"git remote set-url origin {REPO_URL}")
        print_success(f"Remote 'origin' yeniləndi: {REPO_URL}")
    else:
        print_success(f"Remote 'origin' düzgündür: {REPO_URL}")

    # 5. Dəyişikliklərin statusu
    print_step("Dəyişikliklər siyahıya alınır (git status)...")
    status = run_cmd("git status --short", check=False, capture=True)
    if not status:
        print_warn("Göndəriləcək yeni dəyişiklik yoxdur.")
        choice = input("\nYenə də push etmək istəyirsiniz? (h/y): ").strip().lower()
        if choice not in ['h', 'y', 'bəli', 'yes']:
            print("Əməliyyat dayandırıldı.")
            return

    # 6. Commit mesajı
    default_msg = f"Floor Escape Deluxe & Dashboard update - {datetime.now().strftime('%Y-%m-%d %H:%M')}"
    print(f"\nVarsayılan commit mesajı: \033[96m{default_msg}\033[0m")
    user_msg = input("Fərqli commit mesajı yazmaq istəyirsinizsə daxil edin (Enter = varsayılan): ").strip()
    commit_msg = user_msg if user_msg else default_msg

    # 7. git add .
    print_step("Bütün fayllar əlavə edilir (git add .)...")
    run_cmd("git add .")

    # 8. git commit
    print_step(f"Commit icra olunur: \"{commit_msg}\"...")
    commit_res = run_cmd(f'git commit -m "{commit_msg}"', check=False, capture=True)
    if commit_res:
        print(commit_res)
    else:
        print_warn("Yeni commit üçün heç nə dəyişməyib və ya artıq commit olunub.")

    # 9. git push
    print_step(f"GitHub-a göndərilir (git push -u origin {DEFAULT_BRANCH})...")
    push_success = run_cmd(f"git push -u origin {DEFAULT_BRANCH}", check=False)

    if push_success:
        print("\n" + "=" * 60)
        print_success("TƏBRİKLƏR! Bütün layihə GitHub-a uğurla göndərildi!")
        print(f"Repo ünvanı: {REPO_URL}")
        print("=" * 60)
    else:
        print_warn("\nAdi push uğursuz oldu. Bu, uzaq repoda (məsələn README və ya ilk commit) fərqli tarixçə olduqda baş verir.")
        print("Seçimlər:")
        print("1) 'git pull --rebase origin main' edib yenidən göndərmək")
        print("2) Force push ('git push -u origin main --force') ilə uzaq repodakını tam bu kodla əvəz etmək")
        print("3) İmtina etmək")
        
        opt = input("\nSeçiminiz (1/2/3): ").strip()
        if opt == "1":
            print_step("Pull --rebase icra olunur...")
            run_cmd(f"git pull --rebase origin {DEFAULT_BRANCH}", check=False)
            print_step("Yenidən push edilir...")
            run_cmd(f"git push -u origin {DEFAULT_BRANCH}")
            print_success("Uğurla göndərildi!")
        elif opt == "2":
            print_step("Force push icra olunur...")
            run_cmd(f"git push -u origin {DEFAULT_BRANCH} --force")
            print_success("Force push ilə uğurla göndərildi!")
        else:
            print("Əməliyyat dayandırıldı.")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nƏməliyyat istifadəçi tərəfindən dayandırıldı.")
