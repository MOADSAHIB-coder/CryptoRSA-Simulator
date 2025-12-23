
/* ================== INPUT TYPE ================== */
const inputRadios = document.querySelectorAll('input[name="inputType"]');
const inputZone = document.getElementById("inputZone");
const decryptInputZone = document.getElementById("decryptInputZone");

let resultBlob = null;
let resultFileName = "";

/* ===== Switch Text / File ===== */
inputRadios.forEach(radio=>{
    radio.addEventListener("change", ()=>{
        if(radio.value==="file" && radio.checked){
            inputZone.innerHTML = `
                <input type="file" id="fileEncrypt" accept=".txt" style="padding-bottom:5px; padding-top:20px; padding-left:10px;">
            `;
            decryptInputZone.innerHTML = `
                <input type="file" id="fileDecrypt" accept=".txt" style="padding-bottom:5px; padding-top:20px; padding-left:10px;">
            `;
        }else{
            inputZone.innerHTML = `
                <textarea id="textEncrypt" rows="3"
                placeholder="Texte clair à chiffrer..."></textarea>
            `;
            decryptInputZone.innerHTML = `
                <textarea id="textDecrypt" rows="3"
                placeholder="Texte chiffré à déchiffrer..."></textarea>
            `;
        }
    });
});

/* ================== DOWNLOAD ================== */
function downloadResult(){
    if(!resultBlob) return;
    let link = document.createElement("a");
    link.href = URL.createObjectURL(resultBlob);
    link.download = resultFileName;
    link.click();
}

/* ================== RSA UTILS ================== */
function gcd(a,b){return b?gcd(b,a%b):a;}

function modInverse(e, phi){
    let m0 = phi, x0 = 0, x1 = 1;
    while(e > 1){
        let q = Math.floor(e / phi);
        [e, phi] = [phi, e % phi];
        [x0, x1] = [x1 - q * x0, x0];
    }
    if(x1 < 0) x1 += m0;
    return x1;
}

function modPow(base, exp, mod){
    let res = 1;
    base %= mod;
    while(exp > 0){
        if(exp % 2 === 1) res = (res * base) % mod;
        exp = Math.floor(exp / 2);
        base = (base * base) % mod;
    }
    return res;
}

/* ================== STATS ================== */
function saveStat(type){
    let stats = JSON.parse(localStorage.getItem("rsaStats")) || [];
    let inputType = document.querySelector('input[name="inputType"]:checked').value;
    let now = new Date();
    let date = now.toLocaleString("fr-FR");
    stats.push({
        type:type,
        inputType:inputType==="text"?"Texte":"Fichier",
        date:date
    });
    localStorage.setItem("rsaStats", JSON.stringify(stats));
}

/* ================== ENCRYPT ================== */
function encryptRSA(){
    let inputType = document.querySelector('input[name="inputType"]:checked').value;
    let p = parseInt(document.getElementById('p').value);
    let q = parseInt(document.getElementById('q').value);
    let e = parseInt(document.getElementById('e').value);

    if(!p || !q || !e){ alert("Clés RSA manquantes!"); return; }
    let n = p * q;

    /* ===== TEXT ===== */
    if(inputType==="text"){
        let text = document.getElementById('textEncrypt').value;
        if(!text){ alert("Entrez un texte!"); return; }

        let cipher = "";
        for(let c of text){
            cipher += modPow(c.charCodeAt(0), e, n) + " ";
        }

        document.getElementById('result').style.display="block";
        document.getElementById('fileResult').style.display="none";
        document.getElementById('result').value = cipher.trim();

        saveStat("Chiffrement RSA");
    }

    /* ===== FILE ===== */
    else{
        let file = document.getElementById("fileEncrypt").files[0];
        if(!file){ alert("Sélectionnez un fichier!"); return; }

        let reader = new FileReader();
        reader.onload = function(){
            let content = reader.result;
            let cipher = "";
            for(let c of content){
                cipher += modPow(c.charCodeAt(0), e, n) + " ";
            }

            resultBlob = new Blob([cipher], {type:"text/plain"});
            resultFileName = file.name.replace(".txt","")+"_chiffrement.txt";

            document.getElementById("result").style.display="none";
            document.getElementById("fileResult").style.display="block";
            document.getElementById("fileName").innerText =
                "📄 " + resultFileName;

            saveStat("Chiffrement RSA");
        };
        reader.readAsText(file);
    }
}

/* ================== DECRYPT ================== */
function decryptRSA(){
    let inputType = document.querySelector('input[name="inputType"]:checked').value;
    let p = parseInt(document.getElementById('dp').value);
    let q = parseInt(document.getElementById('dq').value);
    let e = parseInt(document.getElementById('de').value);

    if(!p || !q || !e){ alert("Clés RSA manquantes!"); return; }

    let n = p * q;
    let phi = (p - 1) * (q - 1);
    let d = modInverse(e, phi);

    /* ===== TEXT ===== */
    if(inputType==="text"){
        let cipher = document.getElementById("textDecrypt")
            .value.trim().split(/\s+/);

        let text = "";
        for(let c of cipher){
            text += String.fromCharCode(
                modPow(parseInt(c), d, n)
            );
        }

        document.getElementById("fileResult").style.display="none";
        document.getElementById("result").style.display="block";
        document.getElementById("result").value = text;

        saveStat("Déchiffrement RSA");
    }

    /* ===== FILE ===== */
    else{
        let file = document.getElementById("fileDecrypt").files[0];
        if(!file){ alert("Sélectionnez un fichier!"); return; }

        let reader = new FileReader();
        reader.onload = function(){
            let cipher = reader.result.trim().split(/\s+/);
            let text = "";
            for(let c of cipher){
                text += String.fromCharCode(
                    modPow(parseInt(c), d, n)
                );
            }

            resultBlob = new Blob([text], {type:"text/plain"});
            resultFileName =
                file.name.replace(".txt","")+"_dechiffrement.txt";

            document.getElementById("result").style.display="none";
            document.getElementById("fileResult").style.display="block";
            document.getElementById("fileName").innerText =
                "📄 " + resultFileName;

            saveStat("Déchiffrement RSA");
        };
        reader.readAsText(file);
    }
}

/* ================== CRACK RSA ================== */
function crackRSA(){
    let cipherInput = document.getElementById('cipherCrack').value.trim();
    if(cipherInput===""){ alert("Entrez le texte chiffré!"); return; }

    let cipher = cipherInput.split(" ").map(Number);
    let n = parseInt(prompt("Entrez n (p × q)"));
    let e = parseInt(prompt("Entrez e"));

    let p=0,q=0;
    for(let i=2;i<=Math.sqrt(n);i++){
        if(n%i===0){ p=i; q=n/i; break; }
    }
    if(!p){ alert("Impossible de factoriser n!"); return; }

    let phi=(p-1)*(q-1);
    let d=modInverse(e,phi);

    let text="";
    for(let c of cipher){
        text+=String.fromCharCode(modPow(c,d,n));
    }

    document.getElementById("fileResult").style.display = "none";
    document.getElementById("result").style.display = "block";
    document.getElementById("result").value = text;

saveStat("Cassage RSA");

}
