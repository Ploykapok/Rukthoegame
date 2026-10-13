      await shared.db.doc("accounts/" + id).set({ username: u, uid: j.localId, role: "user", createdAt: Date.now() });
      await logEvent("register", u);
      tok = null; save();
      setAuthMode("login", "สมัครสำเร็จ! ล็อกอินได้เลย 💗");
    } else {
      setTok(await idp("signInWithPassword", { email: email, password: pw, returnSecureToken: true }));
      const s = await shared.db.doc("accounts/" + id).get(), name = s.exists ? s.data().username : u;
      await logEvent("login", name);
      enterApp({ id: id, username: name, role: "user" });
    }
  } catch (e) { err.textContent = ERR[String(e.message).split(" ")[0]] || "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง"; }
  finally { btn.disabled = false; }
};
const _enter = enterApp;
enterApp = async function (u) {
  if (tok && shared.db) { try { const s = await shared.db.doc("admins/" + tok.uid).get(); u.role = s.exists ? "admin" : "user"; } catch (e) {} }
  return _enter(u);
};
const _lo = logout; logout = function () { tok = null; save(); _lo(); };
})();
