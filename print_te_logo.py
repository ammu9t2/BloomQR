code = open('js/app-v3.js', encoding='utf-8').read()

idx = code.find("'topLogoLink'")
end_idx = code.find("'scanQrOverlay'", idx)
print(code[idx:end_idx])
