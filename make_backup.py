#!/usr/bin/env python3
"""Generate band-setlist-backup.json from the Sunday Worship Set content."""
import json, os, urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))

songs = [
    # (title, key, singer, chords)
    ("Jesus You're Beautiful", "C", "Abraham", """\
[Verse]
C                     F
Spirit of wisdom, open my eyes again
C                         F
Spirit of revelation, open my heart again


[Pre-Chorus]
        C  G       F
'Cause I want to see You
        C  G      F
Lord, I want to see You
          G          C
See You rightly, Jesus


[Chorus]
   C
I know that Your eyes are like flames of fire
   G
I know that Your head is white as wool
    F                    C
I know that Your voice, it sounds like waters
Dm             C
Jesus, You're beautiful


[Chorus 2]
Csus4 C  G       Csus4 C
There is none like you   Lord
G                 C
Jesus, you're beautiful


[Bridge]
C                             G
There is no one like You in the heavens or on the earth
F                         C       Dm
There is no one like You in the heavens or on the earth"""),

    ("Jesus Lover of my Soul", "C", "Sam", """\
C       G           Gsus G
Jesus, lover of my soul
Am            F           G
Jesus, I will never let You go

C               G             Gsus G
You've taken me from the miry clay
Am (build sound)     F (break)      G (break)
Set my feet upon the rock and now I know
C           G Gsus G
I love You, I need You

Am                            F              G
Though my world may fall, I'll never let You go
C        G     Gsus     G
My Savior, my closest friend
Am                    F              G
I will worship You until the very end"""),

    ("Nothing is Impossible", "C", "P. Joanne", """\
[Chorus]

C                             G                    Am
Through You I can do anything, I can do all things
                                F
'Cause it's You who gives me strength, nothing is impossible
C                             G                          Am
Through You blind eyes are open, strongholds are broken
                   F
I am living by faith, nothing is impossible


[Interlude]

F   C   Dm   F
F   C   Dm   F


[Verse]

C              Dm              F
I'm not gonna live by what I see,
Am            G               F
I'm not gonna live by what I feel


[Pre-Chorus]

Am        G                F
Deep down I, know that You're here with me
Am        G          Dm    F
I know that, You can do anything


[Chorus]

C                             G                    Am
Through You I can do anything, I can do all things
                                F
'Cause it's You who gives me strength, nothing is impossible
C                             G                          Am
Through You blind eyes are open, strongholds are broken
                   F
I am living by faith, nothing is impossible


[Interlude]

F   C   Dm   F


[Bridge]

F           C
I believe, I believe,
Dm          F
I believe, I believe in You
F           C
I believe, I believe,
Dm          F
I believe, I believe in You


[Chorus]

C                             G                    Am
Through You I can do anything, I can do all things
                                F
'Cause it's You who gives me strength, nothing is impossible
C                             G                          Am
Through You blind eyes are open, strongholds are broken
                   F
I am living by faith, nothing is impossible


[Bridge]

F           C
I believe, I believe,
Dm          F
I believe, I believe in You
F           C
I believe, I believe,
Dm          F
I believe, I believe in You"""),

    ("Above Every other Name", "C", "Ana", """\
[Verse]

C            G                     Am
 O Lord, my strength, You're my Redeemer
   F
Forever I will love You


[Pre-Chorus]

 C                    G/C
No one whose hope is in the Lord will ever be put to shame (E - B - C#m - A (Last time through))
F/C                     C
 You are the Rock that is higher than I


[Chorus]

     C                 G
Your name is above every other name
    Am                  F
Your name is above every other name


[Bridge]

     C           G
Hallelujah, hallelujah
    Am          F
Hallelujah, hallelujah


[Tag]

 C
God transcendent (beautiful, beautiful, beautiful)
        C
There's no one like You (beautiful, beautiful, beautiful)"""),

    ("Center", "A", "Ana", """\
[Verse 1]
A
 Maybe we've made this complicated
D
More than it was ever meant to be
F#m
   Hasn't it always been about the same thing
D
Lord, bring us back to simple things


[Chorus]
D           F#m    A    E                          D
You, be the center of it all my heart belongs to You
    F#m    A     E                             C#m
My Savior all in all You're the one I hold on to
                        F#m
For the beauty of Your Name
                  D               E
My soul will live to say Jesus, I love You


[Verse 2]
A
 Teach us to discern the moment
         D
When to serve and when to sit here at Your feet
F#m
   Keep us awake to what's important
          D
Just like Mary chose the better thing


[Chorus]
     D           F#m    A    E                         D
For You, are the center of it all my heart belongs to You
   F#m    A     E                             C#m
My Savior all in all You're the One I hold on to
                        F#m
For the beauty of Your Name
                  D               E
My soul will live to say Jesus, I love You


[Chorus]
     D           F#m    A    E                         D
For You, are the center of it all my heart belongs to You
   F#m    A     E                             C#m
My Savior all in all You're the One I hold on to
                        F#m
For the beauty of Your Name
                  D               E
My soul will live to say Jesus, I love You


[Tag]
        F#m     C#m           D                   E
Oh how I love You,    oh how I love You Jesus I love You
        F#m     C#m           D                   E
Oh how I love You,    oh how I love You Jesus I love You


[Bridge]
        D                             E
My whole life for Your glory my whole world for You only
    F#m                     C#m
Everything for the honor of Your Name
      D                       E
If my days tell a story let it be of You only
    F#m                     C#m
Everything for the honor of Your Name


[Bridge]
        D                             E
My whole life for Your glory my whole world for You only
    F#m                 A
Everything for the honor of Your Name
      D                       E
If my days tell a story let it be of You only
    F#m                 E/G#
Everything for the honor of Your Name


[Bridge]
        D                             E
My whole life for Your glory my whole world for You only
    F#m                 A
Everything for the honor of Your Name
      D                       E
If my days tell a story let it be of You only
    F#m                 A
Everything for the honor of Your Name


[Tag]
        D     E       F#m                 C#m
Oh how I love You oh how I love You Jesus I love You
        D     E       F#m                 C#m
Oh how I love You oh how I love You Jesus I love You


[Chorus]
     D           F#m    A    E                          D
For You, are the center of it all my heart belongs to You
    F#m    A     E                                C#m
My Savior all in all You're the One I hold on to
                        F#m       E
For the beauty of Your Name my soul will live to say
          E
Jesus, I love You


[Outro]
          A/C#    D           E
My soul will live to say Jesus, I love You
          A/C#    D             E        D
My soul will live to say Jesus, I love You"""),

    ("You Deserve the Glory", "A", "P. Joanne", """\
[Verse 1]

              A
You deserve the glory
       C#m   F#m
And the honour
        Bm
Lord, we lift our hands in worship
      E
As we lift your Holy name

(repeat)


[Chorus]

     A
For you are great
       C#7          F#m
You do miracle so great
        C#m             Bm
There is no one else like you
       DM7  C#m Bm  E    A
There is no one else like you"""),

    ("No one like the Lord", "A", "Sam", """\
[Verse 1]
                    D
There is One on the throne
    A       C#m7
Jesus, holy
F#m                Bm7
    He is worthy of praise
    A          E
Honor and glory
(Hey)


[Verse 2]
F#m                    D
   There is One on the throne
    A      C#m7
Jesus, holy
(You are, You are)
F#m                Bm7
    He is worthy of praise
    A          E
Honor and glory


[Chorus]
(So we sing)
F#m    E/G#   A
Worthy is the Lamb
         Bm                    D
Who was slain and seated on the throne
        E                 F#m
There's no one like the Lord
        F#m    E/G#      A
And the elders, creatures bow
        Bm                D
Giving praise to Him and Him alone
              E                F#m
'Cause there's no one like the Lord
(Yeah)


[Verse 3]
                    D
There is One on the throne
    A       C#m7
Jesus, holy
F#m                Bm7
    He is worthy of praise
          A          E
All the honor and glory
(You are, You are)


[Chorus]
F#m    E/G#   A
Worthy is the Lamb
         Bm                    D
Who was slain and seated on the throne
        E                 F#m
There's no one like the Lord
              F#m    E/G#      A
Woah, and the elders, creatures bow
        Bm                    D
Giving praise to Him and Him alone
                E                F#m
'Cause there's no one like the Lord


[Chorus]
(Oh and we cry)
F#m    E/G#   A
Worthy is the Lamb
        Bm                    D
Who was slain and seated on the throne
        E                 F#m
There's no one like the Lord
        F#m    E/G#      A
And the elders, creatures bow
        Bm                D
Giving praise to Him and Him alone
              E                F#m
'Cause there's no one like the Lord


[Bridge]
                        F#m
And we crown You King of glory
                        F#m
And we crown You King of glory
                        D
And we crown You King of glory
      E              F#m
And we crown You Lord of all

                    F#m
We crown You, You are worthy
                    F#m
We crown You, You are worthy
                    D
We crown You, You are worthy
    E                   F#m
We crown You Lord of all
                        F#m
And we crown You King of glory
                        F#m/A
And we crown You King of glory
                        D
And we crown You King of glory
      E                 F#m
And we crown You Lord of all

                    Bm
We crown You, You are worthy
                    F#m/A
We crown You, You are worthy
                    D
We crown You, You are worthy
    E                   F#m
We crown You Lord of all


[Chorus]
          D       E/D    D
Oh we sing worthy is the Lamb
        Bm                    D
Who was slain and seated on the throne
              E                F#m
And there's no one like the Lord
        D         E           F#m
All of the elders, creatures bow
        Bm                    D
Giving praise to Him and Him alone
                              F#m
'Cause there's no one like the Lord


[Chorus]
(Oh, You are)
D        E        F#m
Worthy is the Lamb
        Bm                    D
Who was slain and seated on the throne
        E                 F#m
There's no one like the Lord
                D      E         F#m
And all of the elders, creatures bow
        Bm                D
Giving praise to Him and Him alone
              E                B
'Cause there's no one like the Lord


[Interlude]
D
There's no one like you
B
There's just no one like you
      D
Yeah
(There's no one like the Lord)
                          B
There's no one like the Lord
(There's no one like the Lord)
                          D
So wonderful in all His ways
(There's no one like the Lord)
                          B
So beautiful in all His ways
(There's no one like the Lord)
            D
So majestic
(There's no one like the Lord)
                        B
Oh the King above all Kings
(There's no one like the Lord)
        D
Yeah
(There's no one like the Lord)
                            B
Oh the angels around your throne
(There's no one like the Lord)
Every time they sing, they sing a new song at your feet
D
(There's no one like the Lord)
                        B
They cry Holy, Holy, Holy
(There's no one like the Lord)
                        D
They cry worthy, worthy, worthy
(There's no one like the Lord)
                          B
'cause there's no like you
(There's no one like the Lord)


[Bridge]
                        F#m
And we crown You King of glory
                        F#m/A
And we crown You King of glory
                        B
And we crown You King of glory
                        D
And we crown You Lord of all

                    F#m
We crown You, You are worthy
                          F#m/A
We crown You, You are worthy
                          B
We crown You, You are worthy
                          D
We crown You Lord of all


[Chorus]
          D       E/D    D
Oh we sing worthy is the Lamb
        Bm                    D
Who was slain and seated on the throne
              E                F#m
And there's no one like the Lord
D         E      F#m
All the creatures bow
        Bm                    D
Giving praise to Him and Him alone
              E                F#m
'Cause there's no one like the Lord

D        E        F#m
Worthy is the Lamb
        Bm                    D
Who was slain and seated on the throne
E2                    F#m
There's no one like the Lord
        D       E2         F#m
And the elders, creatures bow
        Bm7                   D
Giving praise to Him and Him alone
              E2                B
'Cause there's no one like the Lord
There's no one like you
D           E2              F#m
 (There's no one like the Lord)
There's no one like you
D           E2              F#m
 (There's no one like the Lord)

D           E2                 F#m
There's just no one like the Lord"""),

    # ---- Extra songs (rendered in the "Extra Songs" section) ----
    ("The More I Seek You", "F", "P. Joanne", """\
[Verse]

F            C
  The more I seek You
Dm           A#
  The more I find You
F            C
  The more I find You
Dm           A#
  The more I love You


[Chorus]

F
  I wanna sit at your feet
C
  Drink from the cup in Your hands
Dm
  Lay back against You and breathe
A#
  Feel Your heart beat
F
  This love is so deep
C
  It's more than I can stand
Dm
  I melt in Your peace
A#
  It's overwhelming"""),

    ("Draw Me Close to You", "Bb", "Sam", """\
[Verse 1]

A#                  D#
 Draw me close to you
Fsus           A#
 Never let me go
Fsus           D#
 I lay it all down again
 Gm                   D#
 To hear you say that I'm your friend


[Verse 2]

A#               D#
 You are my desire
 Fsus              A#
 No one else will do
 Fsus                        D#
 'Cause nothing else could take your place
 Gm                    D#
 To feel the warmth of your embrace
A#               Cm  F                  A#
Help me find the way, bring me back to you


[Chorus]

A#      F       D#
You're all I want
A#      F     D#  F
You're all I ever needed
A#      F      D#
 You're all I want
Cm           F         A#
Help me know you are near"""),

    ("Spirit of the Living God", "D", "P. Joanne", """\
[Verse]

D             A  D/F# Em
Spirit of the living God,
D      G    A  D
Fall afresh on me
D             A  D/F# Em
Spirit of the living God,
D      G    A  D
Fall afresh on me
G
Melt me
D
Mold me
E7
Fill me
A
Use me
D             A  D/F# Em
Spirit of the living God,
D      G    A  D
Fall afresh on me"""),
]

data = {"date": "2026-07-05", "text": {}, "links": {}, "photos": {}}
data["text"]["band-name"] = "Sunday Set List"
data["text"]["date"] = "Sunday · July 5, 2026"

for i, (title, key, singer, chords) in enumerate(songs, start=1):
    data["text"][f"song-title-{i}"] = title
    data["text"][f"song-key-{i}"] = key
    data["text"][f"song-singer-{i}"] = singer
    data["text"][f"song-chords-{i}"] = chords
    q = urllib.parse.quote_plus(f"{title} worship chords")
    data["links"][str(i)] = f"https://www.youtube.com/results?search_query={q}"

out = os.path.join(HERE, "band-setlist-backup.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print("Wrote", out)
