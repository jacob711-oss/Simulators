import re

def state_names(srcs):
    # every top-level let/const/var name in the game's own code: these hold the world, for saving
    names=[]
    for src in srcs:
        for line in src.split('\n'):
            m=re.match(r'(let|const|var)\s+(.*)',line)
            if not m:continue
            rest=m.group(2);depth=0;q=None;start=0;parts=[]
            i=0
            while i<len(rest):
                ch=rest[i]
                if q:
                    if ch=='\\':i+=2;continue
                    if ch==q:q=None
                elif ch in '\'"`':q=ch
                elif ch in '([{':depth+=1
                elif ch in ')]}':depth-=1
                elif ch==',' and depth==0:parts.append(rest[start:i]);start=i+1
                elif ch==';' and depth==0:break
                if depth<0:break
                i+=1
            parts.append(rest[start:i])
            for p in parts:
                n=re.match(r'\s*([A-Za-z_$][\w$]*)\s*(=|$)',p)
                if n and n.group(1) not in names:names.append(n.group(1))
    return names
