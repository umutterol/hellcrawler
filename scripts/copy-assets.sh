#!/bin/bash
# Hellcrawler MVP Asset Copy Script
# Run from project root: ./scripts/copy-assets.sh

set -e

ASSETS_SRC="gamedevmarketassets"
ASSETS_DEST="public/assets"

echo "=== Hellcrawler Asset Copy Script ==="
echo ""

# Check if source directory exists
if [ ! -d "$ASSETS_SRC" ]; then
    echo "ERROR: Source directory '$ASSETS_SRC' not found!"
    echo "Make sure you're running this from the project root."
    exit 1
fi

# Create directory structure
echo "Creating directory structure..."
mkdir -p "$ASSETS_DEST"/{sprites/{tank,enemies/act1,bosses,projectiles,modules},effects/{explosions,hits,muzzle,smoke},backgrounds/act1,ui/{icons,panels,bars},audio/{sfx/{weapons,impacts,ui},music}}

# === TANK ===
echo "Copying tank assets..."
cp "$ASSETS_SRC/Warped Assets/Vehicles/tank-unit/Spritesheets/tank-unit-sheet.png" "$ASSETS_DEST/sprites/tank/tank-sheet.png" 2>/dev/null || echo "  - tank-sheet.png not found"
cp "$ASSETS_SRC/Warped Assets/Vehicles/tank-unit/sprites/"*.png "$ASSETS_DEST/sprites/tank/" 2>/dev/null || echo "  - tank sprites not found"

# === ENEMIES - ACT 1 ===
echo "Copying enemy assets..."

# Imp
cp "$ASSETS_SRC/Gothicvania Assets/Characters/Enemies Pack 2/Imp/imp-sheet.png" "$ASSETS_DEST/sprites/enemies/act1/" 2>/dev/null || echo "  - imp-sheet.png not found"
cp "$ASSETS_SRC/Gothicvania Assets/Characters/Enemies Pack 2/Imp/run/"*.png "$ASSETS_DEST/sprites/enemies/act1/" 2>/dev/null || echo "  - imp run frames not found"

# Wolf (as Hellhound)
cp "$ASSETS_SRC/Gothicvania Assets/Characters/Enemies Pack 2/Wolf/wolf-sheet.png" "$ASSETS_DEST/sprites/enemies/act1/hellhound-sheet.png" 2>/dev/null || echo "  - wolf-sheet.png not found"
for f in "$ASSETS_SRC/Gothicvania Assets/Characters/Enemies Pack 2/Wolf/running/"*.png; do
    if [ -f "$f" ]; then
        newname=$(basename "$f" | sed 's/wolf-running/hellhound-run/')
        cp "$f" "$ASSETS_DEST/sprites/enemies/act1/$newname"
    fi
done

# Mummy (as Possessed Soldier)
cp "$ASSETS_SRC/Gothicvania Assets/Characters/Enemies Pack 2/Mummy/Mummy-sheet.png" "$ASSETS_DEST/sprites/enemies/act1/soldier-sheet.png" 2>/dev/null || echo "  - Mummy-sheet.png not found"
for f in "$ASSETS_SRC/Gothicvania Assets/Characters/Enemies Pack 2/Mummy/Sprites/"*.png; do
    if [ -f "$f" ]; then
        newname=$(basename "$f" | sed 's/Mummy/soldier/')
        cp "$f" "$ASSETS_DEST/sprites/enemies/act1/$newname"
    fi
done

# Fire Skull
cp "$ASSETS_SRC/Gothicvania Assets/Characters/Fire-Skull-Files/Spritesheets/"*.png "$ASSETS_DEST/sprites/enemies/act1/" 2>/dev/null || echo "  - Fire Skull spritesheets not found"
cp "$ASSETS_SRC/Gothicvania Assets/Characters/Fire-Skull-Files/Sprites/"*.png "$ASSETS_DEST/sprites/enemies/act1/" 2>/dev/null || echo "  - Fire Skull sprites not found"

# === BOSS ===
echo "Copying boss assets..."
for f in "$ASSETS_SRC/Gothicvania Assets/Characters/Boss-Demon/Spritesheets/"*.png; do
    if [ -f "$f" ]; then
        newname=$(basename "$f" | sed 's/demon/sentinel/')
        cp "$f" "$ASSETS_DEST/sprites/bosses/$newname"
    fi
done

# === BACKGROUNDS ===
echo "Copying background assets..."
for f in "$ASSETS_SRC/Gothicvania Assets/Backgrounds and Environments/night-town-background-files/layers/"*.png; do
    if [ -f "$f" ]; then
        newname=$(basename "$f" | sed 's/night-town-background-//')
        cp "$f" "$ASSETS_DEST/backgrounds/act1/$newname"
    fi
done

# === PROJECTILES ===
echo "Copying projectile assets..."
cp "$ASSETS_SRC/Warped Assets/Space Shooters/Space Shooter files/shoot/"*.png "$ASSETS_DEST/sprites/projectiles/" 2>/dev/null || echo "  - bullet sprites not found"

# Bolt as missile
for f in "$ASSETS_SRC/Warped Assets/VFX/Warped shooting fx files/Pixelart/Bolt/frames/"*.png; do
    if [ -f "$f" ]; then
        newname=$(basename "$f" | sed 's/bolt/missile/')
        cp "$f" "$ASSETS_DEST/sprites/projectiles/$newname"
    fi
done

# Charged as cannon shell
for f in "$ASSETS_SRC/Warped Assets/VFX/Warped shooting fx files/Pixelart/charged/frames/"*.png; do
    if [ -f "$f" ]; then
        newname=$(basename "$f" | sed 's/charged/cannon/')
        cp "$f" "$ASSETS_DEST/sprites/projectiles/$newname"
    fi
done

# === EFFECTS ===
echo "Copying effect assets..."

# Explosions
cp "$ASSETS_SRC/Warped Assets/VFX/Explosion/spritesheet/"* "$ASSETS_DEST/effects/explosions/" 2>/dev/null || echo "  - explosion spritesheet not found"
cp "$ASSETS_SRC/Warped Assets/VFX/Explosion/sprites/"*.png "$ASSETS_DEST/effects/explosions/" 2>/dev/null || echo "  - explosion sprites not found"

# Big explosion
cp "$ASSETS_SRC/Gamedevmarket 16-bit collection/Explosions and Magic Assets/Explosions/Explosions Pack 9/Big Explosion/big_explosion-sheet.png" "$ASSETS_DEST/effects/explosions/" 2>/dev/null || echo "  - big explosion not found"
cp "$ASSETS_SRC/Gamedevmarket 16-bit collection/Explosions and Magic Assets/Explosions/Explosions Pack 9/Big Explosion/Sprites/"*.png "$ASSETS_DEST/effects/explosions/" 2>/dev/null || echo "  - big explosion sprites not found"

# Hit effects
cp "$ASSETS_SRC/Warped Assets/Space Shooters/Space Shooter files/Hit/sprites/"*.png "$ASSETS_DEST/effects/hits/" 2>/dev/null || echo "  - hit sprites not found"
cp "$ASSETS_SRC/Warped Assets/Space Shooters/Space Shooter files/Hit/hit.png" "$ASSETS_DEST/effects/hits/hit-sheet.png" 2>/dev/null || echo "  - hit sheet not found"

# Spark effects
cp "$ASSETS_SRC/Warped Assets/VFX/Warped shooting fx files/Pixelart/spark/frames/"*.png "$ASSETS_DEST/effects/hits/" 2>/dev/null || echo "  - spark sprites not found"

# Muzzle flash
cp "$ASSETS_SRC/Warped Assets/Space Shooters/Space Shooter files/flash/flash.png" "$ASSETS_DEST/effects/muzzle/" 2>/dev/null || echo "  - muzzle flash not found"

# Smoke (for near-death state)
cp "$ASSETS_SRC/Gamedevmarket 16-bit collection/Explosions and Magic Assets/Explosions/Explosions Pack 9/SmokeColumn/SmokeColumn-sheet.png" "$ASSETS_DEST/effects/smoke/" 2>/dev/null || echo "  - smoke sheet not found"
cp "$ASSETS_SRC/Gamedevmarket 16-bit collection/Explosions and Magic Assets/Explosions/Explosions Pack 9/SmokeColumn/Sprites/"*.png "$ASSETS_DEST/effects/smoke/" 2>/dev/null || echo "  - smoke sprites not found"

# === AUDIO ===
echo "Copying audio assets..."

# Weapon sounds
cp "$ASSETS_SRC/Warped Assets/Space Shooters/Space Shooter files/Sound FX/shot 1.wav" "$ASSETS_DEST/audio/sfx/weapons/shot1.wav" 2>/dev/null || echo "  - shot1.wav not found"
cp "$ASSETS_SRC/Warped Assets/Space Shooters/Space Shooter files/Sound FX/shot 2.wav" "$ASSETS_DEST/audio/sfx/weapons/shot2.wav" 2>/dev/null || echo "  - shot2.wav not found"

# Impact sounds
cp "$ASSETS_SRC/Warped Assets/Space Shooters/Space Shooter files/Sound FX/hit.wav" "$ASSETS_DEST/audio/sfx/impacts/" 2>/dev/null || echo "  - hit.wav not found"
cp "$ASSETS_SRC/Warped Assets/Space Shooters/Space Shooter files/Sound FX/explosion.wav" "$ASSETS_DEST/audio/sfx/impacts/" 2>/dev/null || echo "  - explosion.wav not found"

# Music
cp "$ASSETS_SRC/Warped Assets/Space Shooters/Space Shooter files/music/exports/space-asteroids.mp3" "$ASSETS_DEST/audio/music/combat.mp3" 2>/dev/null || echo "  - combat.mp3 not found"
cp "$ASSETS_SRC/Warped Assets/Space Shooters/Space Shooter files/music/exports/space-asteroids.ogg" "$ASSETS_DEST/audio/music/combat.ogg" 2>/dev/null || echo "  - combat.ogg not found"

echo ""
echo "=== Asset copy complete! ==="
echo ""
echo "Copied assets to: $ASSETS_DEST/"
echo ""
echo "Summary:"
find "$ASSETS_DEST" -type f -name "*.png" | wc -l | xargs echo "  PNG files:"
find "$ASSETS_DEST" -type f -name "*.wav" | wc -l | xargs echo "  WAV files:"
find "$ASSETS_DEST" -type f \( -name "*.mp3" -o -name "*.ogg" \) | wc -l | xargs echo "  Music files:"
echo ""
echo "Next steps:"
echo "  1. Review copied assets in public/assets/"
echo "  2. Check docs/AssetMapping.md for details"
echo "  3. Run 'npm run dev' to test in game"
