import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'orientation.dart';
import 'screens/home_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Menus are portrait; the game screen switches to landscape itself.
  await SystemChrome.setPreferredOrientations(portraitOrientations);
  await SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  runApp(const FrenzyApp());
}

class FrenzyApp extends StatelessWidget {
  const FrenzyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Forehead Frenzy',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFFF3D7F),
          brightness: Brightness.dark,
        ),
        scaffoldBackgroundColor: const Color(0xFF140F2E),
      ),
      home: const HomeScreen(),
    );
  }
}
