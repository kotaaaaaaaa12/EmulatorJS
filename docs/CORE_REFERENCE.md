# EmulatorJS core reference used by Retro Vault

The `core` field is passed to `EJS_core`. Prefer a system alias unless you intentionally want a specific backend core.

## Nintendo

| System | Recommended alias | Recognized backend cores |
| --- | --- | --- |
| NES / Famicom | `nes` | `fceumm`, `nestopia` |
| SNES / Super Famicom | `snes` | `snes9x`, `bsnes` |
| Game Boy / Game Boy Color | `gb` | `gambatte` |
| Game Boy Advance | `gba` | `mgba` |
| Virtual Boy | `vb` | `beetle_vb` |
| Nintendo 64 | `n64` | `mupen64plus_next`, `parallel_n64`, `parallel-n64` |
| Nintendo DS | `nds` | `melonds`, `desmume`, `desmume2015` |

`gbc` is accepted by Retro Vault as a convenience alias and is normalized to `gb` before EmulatorJS starts.

## Sony

| System | Alias | Backend cores |
| --- | --- | --- |
| PlayStation | `psx` | `pcsx_rearmed`, `mednafen_psx_hw` |
| PSP | `psp` | `ppsspp` |

PSP requires Threads.

## Sega

| System | Alias | Backend cores |
| --- | --- | --- |
| Mega Drive / Genesis | `segaMD` | `genesis_plus_gx`, `genesis_plus_gx_wide`, `picodrive` |
| Master System | `segaMS` | `smsplus`, `genesis_plus_gx` |
| Game Gear | `segaGG` | `genesis_plus_gx`, `genesis_plus_gx_wide` |
| Sega CD / Mega CD | `segaCD` | `genesis_plus_gx`, `genesis_plus_gx_wide` |
| 32X | `sega32x` | `picodrive` |
| Saturn | `segaSaturn` | `yabause` |

## Atari

| System | Alias | Backend core |
| --- | --- | --- |
| Atari 2600 | `atari2600` | `stella2014` |
| Atari 5200 | `atari5200` | `a5200` |
| Atari 7800 | `atari7800` | `prosystem` |
| Atari Lynx | `lynx` | `handy` |
| Atari Jaguar | `jaguar` | `virtualjaguar` |

## Arcade and other consoles

| System | Alias / core | Backend cores |
| --- | --- | --- |
| Arcade | `arcade` | `fbneo`, `fbalpha2012_cps1`, `fbalpha2012_cps2` |
| MAME 2003 | `mame2003` | `mame2003`, `mame2003_plus` |
| 3DO | `3do` | `opera` |
| PC Engine / TurboGrafx-16 | `pce` | `mednafen_pce` |
| PC-FX | `pcfx` | `mednafen_pcfx` |
| Neo Geo Pocket / Color | `ngp` | `mednafen_ngp` |
| WonderSwan / Color | `ws` | `mednafen_wswan` |
| ColecoVision | `coleco` | `gearcoleco` |
| Philips CD-i | `same_cdi` | `same_cdi` |

## Commodore and computers

| System | Alias / core | Backend core |
| --- | --- | --- |
| Commodore 64 | `c64` | `vice_x64sc`, `vice_x64` |
| Commodore 128 | `c128` | `vice_x128` |
| Commodore VIC-20 | `vic20` | `vice_xvic` |
| Commodore Plus/4 | `plus4` | `vice_xplus4` |
| Commodore PET | `pet` | `vice_xpet` |
| Commodore Amiga | `amiga` | `puae` |
| Sinclair ZX81 | `81` | `81` |
| ZX Spectrum | `fuse` | `fuse` |
| Amstrad CPC | `cap32` or `crocods` | `cap32`, `crocods` |
| Doom / PrBoom | `prboom` | `prboom` |
| DOSBox Pure | `dos` or `dosbox_pure` | `dosbox_pure` |

DOSBox Pure requires Threads.

## Experimental / newer upstream

Nintendo 3DS appears in newer upstream EmulatorJS code with the `3ds` alias and `azahar` backend. It is not included in the default pinned `4.2.3` core set used by this package. Set a per-game `ejsVersion` such as `nightly` only if you intentionally want to test that moving build. Threads are required by Retro Vault for 3DS launches.
