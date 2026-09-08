import 'package:shared_preferences/shared_preferences.dart';

/// Lembra o último apelido usado (equivalente ao localStorage da web).
class NicknameStore {
  static const _key = 'cj.nickname';

  Future<String> load() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_key) ?? '';
  }

  Future<void> save(String value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, value);
  }
}
