# ESLint Configuration Guide

## 📋 Overview

This project is configured to show ESLint warnings and errors for **ALL files in the workspace**, even when they are not currently open in the editor.

---

## 🔧 Configuration Files

### 1. `.vscode/settings.json`

**Key Settings:**

```json
{
  "eslint.enable": true,
  "eslint.run": "onType", // ⚠️ Run on typing, not just save
  "eslint.problems.showCurrentDocumentOnly": false, // ⚠️ Show all file problems
  "problems.showCurrentInStatus": false, // ⚠️ Show all problems in status bar
  "typescript.tsserver.experimental.enableProjectDiagnostics": true // ⚠️ Enable project-wide TypeScript diagnostics
}
```

**What this does:**
- ✅ ESLint runs as you type, giving immediate feedback
- ✅ Problems panel shows issues from **all files**, not just the open file
- ✅ TypeScript compiler checks the entire project, not just open files
- ✅ Auto-fix on save with `source.fixAll.eslint`

---

### 2. `eslint.config.mjs`

**Enhanced Rules:**

```javascript
{
  // Unused variables (allows _ prefix for ignored vars)
  "@typescript-eslint/no-unused-vars": ["warn", {
    "argsIgnorePattern": "^_",
    "varsIgnorePattern": "^_",
    "caughtErrorsIgnorePattern": "^_"
  }],

  // Console usage (allow console.warn and console.error)
  "no-console": ["warn", {
    "allow": ["warn", "error"]
  }],

  // React hooks
  "react-hooks/exhaustive-deps": "warn",
  "react-hooks/rules-of-hooks": "error",

  // Code quality
  "no-debugger": "warn",
  "no-duplicate-imports": "warn",
  "prefer-const": "warn",
  "no-var": "error",

  // TypeScript
  "@typescript-eslint/no-explicit-any": "warn",
  "@typescript-eslint/ban-ts-comment": "warn"
}
```

**Special file-specific rules:**
- Test files (`*.spec.ts`, `*.test.ts`): Allow `console.log` and `any` types
- Config files (`*.config.js`): Allow `console.log` and `require()`

---

## 🚀 How to Use

### 1. **View All Problems**

Open the **Problems Panel** in VSCode:
- Keyboard: `Ctrl+Shift+M` (Windows/Linux) or `Cmd+Shift+M` (Mac)
- Menu: `View → Problems`

You will see warnings/errors from **all files** in the workspace, grouped by file.

### 2. **Run ESLint Manually**

Check all files at once:

```bash
# Check all files
npm run lint

# Auto-fix issues
npm run lint -- --fix

# Check specific directory
npx eslint app/
npx eslint core/
```

### 3. **Filter Problems by Severity**

In the Problems panel:
- Click the filter icon (funnel)
- Select: "Errors", "Warnings", or "Info"
- Sort by: File, Severity, or Line number

---

## ⚙️ VSCode Restart (Required)

After updating `.vscode/settings.json`, you must reload VSCode:

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type: `Developer: Reload Window`
3. Press Enter

Or simply restart VSCode.

---

## 🔍 Troubleshooting

### **Problem: ESLint not showing warnings on closed files**

**Solution:**
1. Ensure `.vscode/settings.json` has:
   ```json
   "eslint.problems.showCurrentDocumentOnly": false
   ```
2. Reload VSCode window (`Ctrl+Shift+P` → "Reload Window")
3. Check Problems panel (`Ctrl+Shift+M`)

### **Problem: Too many warnings/errors flooding the panel**

**Solution 1: Filter by severity**
- Click filter icon in Problems panel
- Uncheck "Info" and "Warnings", keep only "Errors"

**Solution 2: Suppress specific rules**
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = {};
```

**Solution 3: Adjust rules in `eslint.config.mjs`**
Change `"warn"` to `"off"` for specific rules you want to ignore.

### **Problem: TypeScript errors not showing for all files**

**Solution:**
1. Open any `.ts` or `.tsx` file
2. Wait for TypeScript language server to load (check bottom right status)
3. Increase memory limit in `.vscode/settings.json`:
   ```json
   "typescript.tsserver.maxTsServerMemory": 4096
   ```

---

## 📊 Expected Behavior

After configuration:

| Scenario | Expected Result |
|----------|----------------|
| Open file with ESLint issues | ✅ Red/yellow squiggles appear immediately |
| Closed file with ESLint issues | ✅ Shows in Problems panel |
| Type code with issues | ✅ Warnings appear as you type |
| Save file | ✅ Auto-fixes applied (if enabled) |
| Run `npm run lint` | ✅ Shows all issues across entire project |

---

## 🎯 Best Practices

1. **Keep Problems panel visible** while coding
2. **Address errors before warnings** (sort by severity)
3. **Use ESLint disable comments sparingly** - fix the root cause instead
4. **Run `npm run lint` before commits** to catch all issues
5. **Don't ignore TypeScript errors** - they prevent bugs in production

---

## 📝 Additional VSCode Extensions (Recommended)

Install these for better ESLint experience:

1. **ESLint** (dbaeumer.vscode-eslint) - Already configured
2. **Error Lens** (usernamehw.errorlens) - Shows errors inline
3. **Pretty TypeScript Errors** (yoavbls.pretty-ts-errors) - Better error messages

---

## 🔗 Related Documentation

- [ESLint Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files)
- [VSCode ESLint Extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Next.js ESLint Configuration](https://nextjs.org/docs/app/building-your-application/configuring/eslint)

---

**Last Updated:** 2025-11-19
