import sys, json, re, random
import sympy as sp

def norm(s):
    s = s.strip()
    for a, b in [('−', '-'), ('×', '*'), ('·', '*'), ('÷', '/'), ('π', 'pi'), ('√', 'sqrt'),
                 ('²', '**2'), ('³', '**3'), ('⁴', '**4'), ('^', '**'), ('，', ','), ('（', '('), ('）', ')')]:
        s = s.replace(a, b)
    # 隐式乘法：3x / 3(x) / )( / )x / x(
    s = re.sub(r'(\d)\s*([a-zA-Z(])', r'\1*\2', s)
    s = re.sub(r'\)\s*\(', ')*(', s)
    s = re.sub(r'([a-zA-Z])\s*\(', r'\1*(', s)
    s = re.sub(r'\)\s*([a-zA-Z0-9])', r')*\1', s)
    s = re.sub(r'([a-zA-Z0-9])\s*([a-zA-Z])(?![a-zA-Z(])', r'\1*\2', s)
    return s

def parse(expr):
    try:
        e = sp.sympify(norm(expr), evaluate=False)
        return e
    except Exception:
        return None

def numeric(e):
    return e is not None and len(e.free_symbols) == 0

def cmp(a, b):
    try:
        d = sp.simplify(a - b)
        if d == sp.Integer(0) or d == 0:
            return True
        if numeric(d):
            return abs(complex(d.evalf())) < 1e-9
        for _ in range(3):
            sub = {s: sp.Rational(random.randint(2, 7), random.randint(1, 3)) for s in d.free_symbols}
            try:
                if abs(complex(d.subs(sub).evalf())) > 1e-6:
                    return False
            except Exception:
                return None
        return True
    except Exception:
        return None

def check(eq):
    parts = [p for p in re.split(r'(?<![<>!=])=(?!=)', eq)]
    if len(parts) < 2:
        return {'status': 'unparsed', 'detail': '不是等式'}
    exprs = [parse(p) for p in parts]
    compared = 0
    for i in range(len(exprs) - 1):
        a, b = exprs[i], exprs[i + 1]
        if a is None or b is None:
            continue
        both_num = numeric(a) and numeric(b)
        share = bool(a.free_symbols & b.free_symbols)
        if not (both_num or share):
            continue
        r = cmp(a, b)
        if r is False:
            return {'status': 'fail', 'detail': '第 %d 段与第 %d 段不相等' % (i + 1, i + 2)}
        if r is True:
            compared += 1
    if compared:
        return {'status': 'ok', 'detail': '已核对 %d 处' % compared}
    return {'status': 'unparsed', 'detail': '含未知函数或无法比较'}

data = json.load(sys.stdin)
out = []
for eq in data.get('equations', []):
    item = {'equation': eq}
    try:
        item.update(check(eq))
    except Exception as e:
        item.update({'status': 'unparsed', 'detail': '异常: ' + str(e)[:60]})
    out.append(item)
print(json.dumps({'items': out}, ensure_ascii=False))