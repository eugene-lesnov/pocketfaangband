/* Copyright (C) 2026 PocketAngband contributors. SPDX-License-Identifier: GPL-2.0-only */

#include "main.h"
#include "buildid.h"
#include "cave.h"
#include "cmds.h"
#include "game-input.h"
#include "game-world.h"
#include "grafmode.h"
#include "init.h"
#include "message.h"
#include "mon-desc.h"
#include "mon-lore.h"
#include "mon-predicate.h"
#include "mon-util.h"
#include "effects.h"
#include "monster.h"
#include "obj-chest.h"
#include "obj-desc.h"
#include "obj-gear.h"
#include "obj-ignore.h"
#include "obj-info.h"
#include "obj-knowledge.h"
#include "obj-pile.h"
#include "obj-tval.h"
#include "obj-util.h"
#include "object.h"
#include "player.h"
#include "player-birth.h"
#include "player-calcs.h"
#include "player-properties.h"
#include "player-spell.h"
#include "player-timed.h"
#include "player-util.h"
#include "project.h"
#include "store.h"
#include "target.h"
#include "trap.h"
#include "ui-command.h"
#include "ui-display.h"
#include "ui-menu.h"
#include "ui-game.h"
#include "ui-input.h"
#include "ui-keymap.h"
#include "ui-map.h"
#include "ui-mon-lore.h"
#include "ui-object.h"
#include "ui-output.h"
#include "ui-player.h"
#include "ui-prefs.h"
#include "z-file.h"
#include "z-type.h"
#include <emscripten.h>

enum { RUN_STEP_DELAY_MS = 80, EXPLORE_STEP_DELAY_MS = 55 };

static enum web_input_mode input_mode;
static const char *input_prompt;
struct web_text_entry {
    const char *title;
    const struct object *item;
    const char *note;
    bool automatic;
};

static const struct web_text_entry *text_entry;
static const char *cast_warning;
static cmd_code direction_command;
static bool pace_run;
static bool background_save;
static bool action_messages_pending;
static void web_text_color(char *buffer, size_t size, int attr);
static const char *const input_modes[] = {
    [WEB_INPUT_TERMINAL] = "terminal",
    [WEB_INPUT_COMMAND] = "command",
    [WEB_INPUT_MENU] = "menu",
    [WEB_INPUT_NAME] = "name",
    [WEB_INPUT_TEXT] = "text",
    [WEB_INPUT_KEY] = "key",
    [WEB_INPUT_QUANTITY] = "quantity",
    [WEB_INPUT_CONFIRM] = "confirm",
    [WEB_INPUT_AIM] = "aim",
    [WEB_INPUT_TARGET] = "target",
    [WEB_INPUT_SAVE_SLOTS] = "save-slots",
    [WEB_INPUT_DIRECTION] = "direction",
    [WEB_INPUT_RUN_DIRECTION] = "run-direction",
    [WEB_INPUT_MORE] = "more",
    [WEB_INPUT_REST] = "rest",
    [WEB_INPUT_OVERVIEW] = "overview",
    [WEB_INPUT_LOCATE] = "locate",
    [WEB_INPUT_DETAILS] = "details",
    [WEB_INPUT_HELP] = "help",
    [WEB_INPUT_MESSAGE_RECALL] = "message-recall",
    [WEB_INPUT_HISTORY] = "history",
    [WEB_INPUT_BIRTH_STATS] = "birth-stats",
    [WEB_INPUT_BIRTH_ROLL] = "birth-roll",
    [WEB_INPUT_BIRTH_REVIEW] = "birth-review",
    [WEB_INPUT_CHARACTER] = "character",
    [WEB_INPUT_SPLASH] = "splash",
    [WEB_INPUT_OPTION_NUMBER] = "option-number",
    [WEB_INPUT_VICTORY] = "victory",
    [WEB_INPUT_RESULTS_LIST] = "results-list",
    [WEB_INPUT_RESULTS_FILE] = "results-file",
    [WEB_INPUT_RETIRE] = "retire",
};

enum web_input_mode web_set_input_mode(enum web_input_mode mode)
{
    enum web_input_mode previous = input_mode;
    input_mode = mode;
    return previous;
}

char web_choose_shape_action(const char *verb)
{
    struct menu *menu = menu_dynamic_new();
    char title[96], action[96];
    strnfmt(title, sizeof(title), "Change back and %s?", verb);
    strnfmt(action, sizeof(action), "Change back and %s", verb);
    menu->title = title;
    menu->selections = "yrn";
    menu->web_no_keyboard = true;
    menu_dynamic_add(menu, action, 'y');
    menu_dynamic_add(menu, "Return to normal", 'r');
    menu_dynamic_add(menu, "Stay in current form", 'n');
    menu->cursor = 2;
    menu_layout(menu, &SCREEN_REGION);
    int result = menu_dynamic_select(menu);
    menu_dynamic_free(menu);
    return result == 'y' || result == 'r' ? result : 'n';
}

const char *web_set_prompt(const char *prompt)
{
    const char *previous = input_prompt;
    input_prompt = prompt;
    return previous;
}

static bool web_edit_text(const struct web_text_entry *entry, const char *prompt, char *buf, size_t size)
{
    const struct web_text_entry *previous = text_entry;
    text_entry = entry;
    bool entered = get_string(prompt, buf, size);
    text_entry = previous;
    return entered;
}

bool web_get_command_string(struct command *cmd, const char *title, const char *prompt, char *buf, size_t size)
{
    struct object *obj = NULL;
    if (cmd->code == CMD_INSCRIBE) cmd_get_arg_item(cmd, "item", &obj);
    struct web_text_entry entry = { .title = title, .item = obj, .note = obj ? quark_str(obj->note) : NULL };
    return web_edit_text(&entry, prompt, buf, size);
}

bool web_edit_autoinscription(struct object_kind *kind, const char *rune, const char *note,
        char *buf, size_t size)
{
    char title[256];
    struct object obj = { 0 };
    if (kind) {
        obj.kind = kind;
        obj.tval = kind->tval;
        obj.sval = kind->sval;
        obj.number = 1;
        obj.known = &obj;
        if (kind->aware || !kind->flavor) {
            of_copy(obj.flags, kind->flags);
            obj.effect = kind->effect;
            obj.time = kind->time;
        }
        object_desc(title, sizeof(title), &obj, ODESC_BASE | ODESC_CAPITAL, player);
    } else {
        my_strcpy(title, rune, sizeof(title));
        my_strcap(title);
    }
    struct web_text_entry entry = { .title = title, .item = kind ? &obj : NULL,
        .note = note, .automatic = true };
    my_strcpy(buf, note ? note : "", size);
    return web_edit_text(&entry, "Inscribe with:", buf, size);
}

const char *web_set_text_prompt(const char *prompt)
{
    if (text_entry && (text_entry->item || text_entry->automatic)) Term_gotoxy(0, 0);
    return web_set_prompt(prompt);
}

EM_JS(void, clear_action_messages, (void), {
    Module['actionMessages'] = [];
});

void web_clear_displayed_messages(void)
{
    if (!action_messages_pending) clear_action_messages();
}

bool web_has_pending_messages(void)
{
    return action_messages_pending;
}

void web_mark_messages_displayed(void)
{
    action_messages_pending = false;
}

EM_JS(void, append_action_message, (const char *message, int type, const char *color), {
    const entries = Module['actionMessages'];
    const text = UTF8ToString(message);
    const previous = entries.at(-1);
    if (previous?.text === text && previous.type === type) previous.count++;
    else entries.push({ text, type, count: 1, color: UTF8ToString(color) });
});

bool web_capture_action_message(const char *message, int type)
{
    if (!player || !character_dungeon || player->is_dead || !player->upkeep->playing) return false;
    if (!*message) return true;
    web_clear_displayed_messages();
    char color[8];
    web_text_color(color, sizeof(color), message_type_color(type));
    append_action_message(message, type, color);
    action_messages_pending = true;
    return true;
}

void web_add_journal_message(const char *message)
{
    message_add(message, MSG_GENERIC);
    web_capture_action_message(message, MSG_GENERIC);
}

bool web_confirm_cast(const char *warning, const char *prompt)
{
    message_add(warning, MSG_GENERIC);
    cast_warning = warning;
    bool confirmed = get_check(prompt);
    cast_warning = NULL;
    return confirmed;
}

cmd_code web_set_direction_command(cmd_code code)
{
    cmd_code previous = direction_command;
    direction_command = code;
    return previous;
}

EM_JS(void, set_aim_options, (bool current, bool nearest, bool selecting, int x, int y,
        const int *path, int length, const char *description), {
    Module['inputContext'] = { current: !!current, nearest: !!nearest, selecting: !!selecting,
        target: current ? { x, y } : undefined,
        aimPath: length ? HEAP32.slice(path >>> 2, (path >>> 2) + length) : undefined,
        targetDescription: UTF8ToString(description), prepared: Module['aimCommand'] };
});

EM_JS(void, set_aim_command, (const char *name, int mana), {
    Module['aimCommand'] = name ? { name: UTF8ToString(name), mana } : undefined;
});

void web_set_aim_command(struct command *cmd)
{
    char name[192];
    int mana = -1, index;
    struct object *obj;
    if (!cmd) {
        set_aim_command(NULL, -1);
        return;
    }
    if (cmd->code == CMD_CAST && cmd_get_arg_choice(cmd, "spell", &index) == CMD_OK) {
        const struct class_spell *spell = spell_by_index(player, index);
        my_strcpy(name, spell->name, sizeof(name));
        mana = spell->smana;
    } else if (cmd_get_arg_item(cmd, "item", &obj) == CMD_OK && obj) {
        object_desc(name, sizeof(name), obj, ODESC_PREFIX | ODESC_FULL, player);
    } else {
        my_strcpy(name, cmd_verb(cmd->code), sizeof(name));
    }
    set_aim_command(name, mana);
}

struct web_store_trade {
    struct store *store;
    struct object *item;
    const char *verb;
    bool from_stock;
    int maximum;
    int shortfall;
};

static const struct web_store_trade *current_trade;

static int stock_price(struct store *store, struct object *stock, int amount)
{
    if (!tval_can_have_charges(stock) || amount == stock->number)
        return price_item(store, stock, false, amount);

    struct object part = { 0 };
    object_copy_amt(&part, stock, amount);
    int price = price_item(store, &part, false, amount);
    object_wipe(&part);
    return price;
}

int web_store_price_one(struct store *store, struct object *stock)
{
    return stock_price(store, stock, 1);
}

static int stock_limit(struct web_store_trade *trade, bool single)
{
    struct object *stock = trade->item;
    struct store *store = trade->store;
    int high = MIN(single ? 1 : stock->number, inven_carry_num(player, stock));
    if (store_is_home(store)) return high;

    int unit_price = web_store_price_one(store, stock);
    trade->shortfall = MAX(0, unit_price - player->au);
    if (trade->shortfall || (!object_flavor_is_aware(stock) && pack_is_full())) return 0;
    if (high < 2) return high;
    if (!tval_can_have_charges(stock))
        return unit_price ? MIN(high, player->au / unit_price) : high;

    int low = 1;
    while (low < high) {
        int mid = low + (high - low + 1) / 2;
        if (stock_price(store, stock, mid) <= player->au) low = mid;
        else high = mid - 1;
    }
    return low;
}

static int trade_amount(const char *value, int maximum)
{
    if (streq(value, "*")) return maximum;
    if (!value[0] || value[strspn(value, "0123456789")]) return 0;
    int amount = atoi(value);
    return amount <= maximum ? amount : 0;
}

int web_store_quantity(struct store *store, struct object *item, bool from_stock, bool single)
{
    bool home = store_is_home(store);
    const char *verb = from_stock ? (home ? "Take" : "Buy") :
        home ? "Stash" : OPT(player, birth_no_selling) ? "Give" : "Sell";
    struct web_store_trade trade = { store, item, verb, from_stock, item->number, 0 };
    if (from_stock) trade.maximum = stock_limit(&trade, single);
    int owned = from_stock && (home || object_flavor_is_aware(item)) ? find_inven(item) : 0;
    char prompt[80], value[8] = "1";
    strnfmt(prompt, sizeof(prompt), "%s how many%s? (max %d)", verb,
        owned ? format(" (you have %d)", owned) : "", trade.maximum);

    enum web_input_mode previous = web_set_input_mode(WEB_INPUT_QUANTITY);
    current_trade = &trade;
    bool entered = get_string(prompt, value, sizeof(value));
    current_trade = NULL;
    web_set_input_mode(previous);
    return entered ? trade_amount(value, trade.maximum) : 0;
}

EM_JS(void, set_edit_value, (const char *value, int cursor, bool initial), {
    Module['inputContext'] = { value: UTF8ToString(value), cursor, initial: !!initial };
});

EM_JS(void, set_trade_quote, (const char *verb, const char *item, int maximum, int amount,
        int price, int gold, int shortfall, bool usable), {
    Module['inputContext'].trade = { verb: UTF8ToString(verb), item: UTF8ToString(item), maximum, amount,
        price, gold, shortfall, usable: !!usable };
});

EM_JS(void, add_inscription_details, (const char *scope, const char *type, bool wearable, bool equipped,
        bool throwing, bool activation, bool fuel, bool readable, bool roguelike, bool pickup_always), {
    Module['inputContext'].inscription = { scope: UTF8ToString(scope), type: UTF8ToString(type), wearable: !!wearable,
        equipped: !!equipped, throwing: !!throwing, activation: !!activation, fuel: !!fuel,
        readable: !!readable, roguelike: !!roguelike, pickupAlways: !!pickup_always };
});

EM_JS(void, set_text_value, (const char *value, size_t size, bool multiline, int x, int y), {
    Module['inputContext'] = { value: UTF8ToString(value), textMaxBytes: size - 1,
        multiline: !!multiline, promptCell: x > 0 ? { x, y } : undefined };
});

void web_set_text_value(const char *value, size_t size, bool multiline, int x, int y)
{
    const struct object *obj = text_entry ? text_entry->item : NULL;
    const char *note = text_entry ? text_entry->note : NULL;
    set_text_value(note && strlen(note) >= size ? note : value, size, multiline, x, y);
    if (!obj && !(text_entry && text_entry->automatic)) return;
    const char *scope = !text_entry->automatic ? "item" : obj ? "kind" : "rune";
    bool known = obj && obj->known && obj->known->kind == obj->kind;
    bool wearable = known && tval_is_wearable(obj);
    bool equipped = wearable && object_is_equipped(player->body, obj);
    bitflag flags[OF_SIZE] = { 0 };
    if (known) object_flags_known(obj, flags);
    bool activation = wearable && object_effect(obj->known) && randcalc(obj->time, 0, MAXIMISE) > 0;
    bool fuel = known && tval_is_light(obj) && !equipped && (text_entry->automatic || obj->timeout > 0) &&
        of_has(flags, OF_TAKES_FUEL) && !of_has(flags, OF_NO_FUEL);
    add_inscription_details(scope, tval_find_name(known ? obj->tval : TV_NULL),
        wearable, equipped, of_has(flags, OF_THROWING), activation, fuel,
        known && tval_is_book_k(obj->kind) && obj_can_browse(obj),
        OPT(player, rogue_like_commands), OPT(player, pickup_always));
}

EM_JS(void, web_set_name_value, (const char *value, size_t size), {
    Module['inputContext'] = { value: UTF8ToString(value), nameMaxBytes: size - 1 };
});

EM_JS(bool, web_read_text, (char *buf, size_t size), {
    const value = Module['submittedText'];
    Module['submittedText'] = undefined;
    if (typeof value !== "string" || value.includes(String.fromCharCode(0)) ||
            lengthBytesUTF8(value) >= size) return false;
    stringToUTF8(value, buf, size);
    return true;
});

EM_JS(void, web_set_direction_center, (bool available), {
    Module['inputContext'] = { center: !!available };
});

EM_JS(void, web_set_target_options, (bool free_aim, int count, bool can_select,
        bool can_inspect, bool attack), {
    Module['targetOptions'] = { freeAim: !!free_aim, targetCount: count,
        canSelect: !!can_select, canInspect: !!can_inspect, attack: !!attack };
});

EM_JS(void, web_set_monster_sort, (bool by_exp), {
    Module['inputContext'] = { ...Module['inputContext'], sortByExp: !!by_exp };
});

static const void *list_block;

static void web_text_color(char *buffer, size_t size, int attr)
{
    const uint8_t *color = angband_color_table[attr];
    strnfmt(buffer, size, "#%02x%02x%02x", color[1], color[2], color[3]);
}

EM_JS(void, start_list, (int graphics_mode, const uint8_t *colors, int count), {
    Module['inputContext'] = { list: [], graphicsMode: graphics_mode,
        palette: HEAPU8.slice(colors, colors + 4 * count) };
});

void web_set_list_block(const void *block)
{
    list_block = block;
    if (block) start_list(use_graphics, &angband_color_table[0][0], MAX_COLORS);
}

bool web_is_list_block(const void *block)
{
    return block && block == list_block;
}

EM_JS(void, add_list_row, (const char *text, const char *location, const char *color), {
    Module['inputContext'].list.push({ text: UTF8ToString(text).trim(),
        location: location ? UTF8ToString(location).trim() : undefined,
        color: UTF8ToString(color) });
});

void web_add_list_row(const char *text, const char *location, int attr)
{
    char color[8];
    web_text_color(color, sizeof(color), attr);
    add_list_row(text, location, color);
}

EM_JS(void, web_set_list_entry, (wchar_t symbol, int symbol_attr, int race, int object), {
    const row = Module['inputContext'].list.at(-1);
    row.symbol = symbol;
    row.symbolAttr = symbol_attr;
    row.race = race;
    row.object = object;
});

EM_JS(void, set_list_row_cell, (int x, int y), {
    Module['inputContext'].list.at(-1).cell = { x, y };
});

void web_set_list_row_cell(int dx, int dy)
{
    const term *map = angband_term[WEB_MAP_TERM];
    set_list_row_cell((player->grid.x + dx - map->offset_x) * tile_width,
        (player->grid.y + dy - map->offset_y) * tile_height);
}

EM_JS(void, set_detail_text, (const wchar_t *text, const uint8_t *attrs, size_t length,
        const uint8_t *colors, int color_count, int graphics_mode, const char *destination), {
    const context = Module['inputContext'];
    const target = UTF8ToString(destination);
    if (target === "screen" && context?.list) {
        context.detail = "";
        return;
    }
    const detail = { codepoints: HEAPU32.slice(text >>> 2, (text >>> 2) + length),
        attributes: HEAPU8.slice(attrs, attrs + length), palette: HEAPU8.slice(colors, colors + 4 * color_count),
        graphicsMode: graphics_mode };
    if (target === "card") Module['inputMenu'].card = detail;
    else if (target === "list") Module['listDetail'] = detail;
    else if (target === "trade") context.trade.description = detail;
    else if (target === "results") context.resultsList.description = detail;
    else Module['inputContext'] = { detail };
});

static void publish_details(textblock *tb, const char *destination)
{
    set_detail_text(textblock_text(tb), textblock_attrs(tb), textblock_length(tb),
        &angband_color_table[0][0], MAX_COLORS, use_graphics, destination);
}

void web_set_edit_value(const char *value, int cursor, bool initial)
{
    set_edit_value(value, cursor, initial);
    const struct web_store_trade *trade = current_trade;
    if (!trade) return;

    bool home = store_is_home(trade->store);
    bool buying = trade->from_stock && !home;
    int amount = trade_amount(value, trade->maximum);
    struct object part = { 0 };
    char name[512];
    object_copy_amt(&part, trade->item, amount ? amount : 1);
    object_desc(name, sizeof(name), &part, ODESC_PREFIX | ODESC_FULL | (buying ? ODESC_STORE : 0), player);
    int price = home ? -1 : price_item(trade->store, &part, !trade->from_stock, part.number);
    bool usable = !buying || !tval_is_book_k(part.kind) || obj_can_browse(&part);
    set_trade_quote(trade->verb, name, trade->maximum, amount, price,
        player->au, trade->shortfall, usable);
    object_wipe(&part);
    if (initial && !buying) {
        textblock *tb = object_info(trade->item, OINFO_NONE);
        publish_details(tb, "trade");
        textblock_free(tb);
    }
}

EM_JS(void, set_book_browse_key, (int key), {
    Module['inputContext'].browseKey = String.fromCharCode(key);
});

struct keypress web_show_details(textblock *tb, const char *header, int browse_key)
{
    enum web_input_mode previous = web_set_input_mode(WEB_INPUT_DETAILS);
    const char *previous_prompt = web_set_prompt(header);
    screen_save();
    publish_details(tb, "screen");
    if (browse_key) set_book_browse_key(browse_key);
    struct keypress choice = inkey();
    web_set_prompt(previous_prompt);
    web_set_input_mode(previous);
    screen_load();
    return choice;
}

EM_JS(void, web_set_overview, (int width, int height, bool has_region, const char *place, int exits), {
    const directions = ["ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft"];
    Module['inputContext'] = { overview: { x: 1, y: 1, width, height, hasRegion: !!has_region,
        place: place ? UTF8ToString(place) : "", places: place ? [] : undefined,
        exits: directions.filter((_, i) => exits & (1 << i)) } };
});

EM_JS(void, web_region_place, (int index, const char *name, int level, const char *down,
        bool player_here, bool east, bool south), {
    Module['inputContext'].overview.places.push({ index, name: UTF8ToString(name), level,
        down: down ? UTF8ToString(down) : "", playerHere: !!player_here, east: !!east, south: !!south });
});

void web_set_menu_card(textblock *tb)
{
    publish_details(tb, "card");
}

EMSCRIPTEN_KEEPALIVE void web_list_details(int race, int object)
{
    textblock *tb;
    if (race > 0 && race < z_info->r_max) {
        tb = textblock_new();
        lore_description(tb, &r_info[race], get_lore(&r_info[race]), false);
    } else if (object > 0 && object < cave->obj_max && cave->objects[object] && cave->objects[object]->known) {
        tb = object_info(cave->objects[object], OINFO_NONE);
    } else {
        return;
    }
    publish_details(tb, "list");
    textblock_free(tb);
}

EM_JS(void, web_set_option_notice, (const char *message), {
    Module['inputContext'] = { detail: UTF8ToString(message) };
});

EM_JS(void, web_set_history, (const char *text), {
    Module['inputContext'] = { detail: UTF8ToString(text) };
});

EM_JS(bool, skip_splash, (void), {
    return !!Module['skipSplash'];
});

EM_JS(void, set_splash_version, (const char *version), {
    Module['inputContext'] = { version: UTF8ToString(version) };
});

void web_show_splash(bool startup)
{
    if (startup && skip_splash()) return;
    enum web_input_mode previous = web_set_input_mode(WEB_INPUT_SPLASH);
    set_splash_version(buildver);
    (void)inkey();
    web_set_input_mode(previous);
}

EM_JS(void, web_finish_run, (bool new_game), {
    Module['afterRun'] = new_game ? "new-game" : "save-slots";
});

void web_cancel_birth(void)
{
    web_finish_run(false);
    quit(NULL);
}

EM_JS(void, web_set_outcome, (const char *kind, const char *name, const char *race,
        const char *class_name, int level, const char *place, int32_t exp, int32_t gold,
        const char *cause, double timestamp), {
    Module['inputContext'] = { outcome: {
        kind: UTF8ToString(kind), name: UTF8ToString(name), race: UTF8ToString(race),
        className: UTF8ToString(class_name), level, place: UTF8ToString(place), exp, gold,
        cause: UTF8ToString(cause), timestamp,
    } };
});

EM_JS(void, web_set_results_list, (const char *title), {
    Module['inputContext'] = { resultsList: { title: UTF8ToString(title), sections: [{ entries: [] }] } };
});

EM_JS(void, web_add_results_section, (const char *title), {
    Module['inputContext'].resultsList.sections.push({ title: UTF8ToString(title), entries: [] });
});

EM_JS(void, web_add_results_entry, (const char *text, const char *detail, bool highlighted), {
    Module['inputContext'].resultsList.sections.at(-1).entries.push({
        text: UTF8ToString(text), detail: detail ? UTF8ToString(detail) : "", highlighted: !!highlighted,
    });
});

EM_JS(void, set_results_file, (const char *title, const char *path, const char *filename), {
    Module['inputContext'] = { resultsFile: {
        title: UTF8ToString(title), filename: UTF8ToString(filename),
        data: path ? Module['readResultsFile'](UTF8ToString(path)) : undefined,
    } };
});

void web_wait_for_back(enum web_input_mode mode)
{
    enum web_input_mode previous = web_set_input_mode(mode);
    while (inkey().code != ESCAPE) {}
    web_set_input_mode(previous);
}

EM_JS(void, set_results_action, (int key, const char *label), {
    Module['inputContext'].resultsList.action = { key: String.fromCharCode(key), label: UTF8ToString(label) };
});

bool web_show_results(textblock *description, int key, const char *label)
{
    if (description) publish_details(description, "results");
    if (!key) {
        web_wait_for_back(WEB_INPUT_RESULTS_LIST);
        return false;
    }
    set_results_action(key, label);
    enum web_input_mode previous = web_set_input_mode(WEB_INPUT_RESULTS_LIST);
    keycode_t choice;
    do {
        choice = inkey().code;
    } while (choice != ESCAPE && choice != key);
    web_set_input_mode(previous);
    return choice == key;
}

EM_JS(void, set_help_pages, (const char *help_dir, bool roguelike), {
    const directory = UTF8ToString(help_dir);
    const decoder = new TextDecoder();
    const read = (name) => {
        const data = Module['readResultsFile'](directory + "/" + name);
        return data ? decoder.decode(data) : "";
    };
    Module['inputContext'] = { help: {
        commands: read(roguelike ? "r_comm.txt" : "commands.txt"),
        symbols: read("symbols.txt"),
    } };
});

void web_show_help(bool roguelike)
{
    set_help_pages(ANGBAND_DIR_HELP, roguelike);
    web_wait_for_back(WEB_INPUT_HELP);
}

void web_show_generated_file(const char *title, const char *path, const char *filename)
{
    set_results_file(title, path, filename);
    if (path) file_delete(path);
    web_wait_for_back(WEB_INPUT_RESULTS_FILE);
}

bool web_get_export_filename(const char *suggested, char *filename, size_t size)
{
    my_strcpy(filename, suggested, size);
    return get_string("File name: ", filename, size) &&
        filename[0] && filename[0] != ' ';
}

EM_JS(void, send_file_download, (const char *path, const char *filename, const char *error), {
    Module['downloadFile'](path ? UTF8ToString(path) : undefined, UTF8ToString(filename), UTF8ToString(error));
});

void web_download_file(const char *path, const char *filename, const char *error)
{
    send_file_download(path, filename, error);
    if (path) file_delete(path);
}

EM_JS(void, web_set_character, (const char *name, const char *race, const char *class_name, const char *title,
        int level, const char *history, int hp, int max_hp, int sp, int max_sp, bool magic), {
    Module['characterSheet'] = {
        name: UTF8ToString(name), race: UTF8ToString(race), className: UTF8ToString(class_name),
        title: UTF8ToString(title), level, history: UTF8ToString(history), hp, maxHp: max_hp, sp, maxSp: max_sp,
        magic: !!magic, rows: [], defenses: [],
    };
});

EM_JS(void, web_character_row, (int section, const char *label, const char *value), {
    Module['characterSheet'].rows.push({
        section, label: UTF8ToString(label), value: UTF8ToString(value).trim().replace(/ +/g, " "),
    });
});

EM_JS(void, web_character_stat_breakdown, (const char *base, int race_bonus, int class_bonus,
        int equipment_bonus, const char *best), {
    const row = Module['characterSheet'].rows.at(-1);
    row.breakdown = { base: UTF8ToString(base).trim(), raceBonus: race_bonus, classBonus: class_bonus,
        equipmentBonus: equipment_bonus, best: UTF8ToString(best).trim() };
});

EM_JS(void, web_character_defense, (const char *group, const wchar_t *label, int length,
        const char *value, const char *temporary), {
    Module['characterSheet'].defenses.push({
        group: UTF8ToString(group),
        label: String.fromCodePoint(...HEAPU32.subarray(label >>> 2, (label >>> 2) + length)).trim(),
        value: UTF8ToString(value), temporary: temporary ? UTF8ToString(temporary) : "",
    });
});

EM_JS(void, web_character_defense_source, (const char *name, const char *value), {
    const row = Module['characterSheet'].defenses.at(-1);
    if (!row.sources) row.sources = [];
    row.sources.push({ name: UTF8ToString(name), value: UTF8ToString(value) });
});

EM_JS(void, set_menu, (const struct menu *menu, int cursor, const char *prompt, bool no_keyboard, bool choice), {
    Module['inputMenu'] = { id: menu, cursor, prompt: prompt ? UTF8ToString(prompt) : "",
        rows: [], actions: [], noKeyboard: !!no_keyboard, choice: !!choice };
});

void web_set_menu(const struct menu *menu, int cursor, const char *prompt)
{
    set_menu(menu, cursor, prompt, menu->web_no_keyboard, menu->web_choice);
}

EM_JS(void, web_begin_search, (void), {
    Module['knowledgeSearch'] = { rows: [] };
});

EM_JS(void, web_search_section, (int section, const char *name, bool store, bool enabled), {
    const search = Module['knowledgeSearch'];
    search.section = section;
    search.rows.push({ index: search.rows.length, section, entry: -2, sectionOnly: true,
        name: UTF8ToString(name), enabled: !!enabled, group: store ? "Home" : undefined,
        collapsible: !!store });
});

EM_JS(void, web_add_search_entry, (int entry, const char *name, const char *group, const char *price), {
    const search = Module['knowledgeSearch'];
    search.rows.push({ index: search.rows.length, section: search.section, entry, enabled: true,
        name: UTF8ToString(name), detail: group ? UTF8ToString(group) : "", price: price ? UTF8ToString(price) : "" });
});

EM_JS(void, web_show_search_rows, (void), {
    const menu = Module['inputMenu'];
    menu.search = true;
    menu.rows = Module['knowledgeSearch'].rows;
});

EM_JS(int, web_search_target, (int index, int *entry), {
    const row = Module['knowledgeSearch'].rows[index];
    if (!row?.enabled) return -1;
    HEAP32[entry >>> 2] = row.entry;
    return row.section;
});

EM_JS(void, web_end_search, (void), {
    Module['knowledgeSearch'] = undefined;
});

EM_JS(void, web_set_menu_title, (const char *title), {
    Module['inputMenu'].title = UTF8ToString(title);
});

EM_JS(void, web_set_menu_selection_title, (const char *title), {
    Module['inputMenu'].selectionTitle = UTF8ToString(title).trim();
});

EM_JS(void, web_set_pickup_menu, (void), {
    Module['inputMenu'].pickup = true;
});

EM_JS(int, web_preferred_save_cursor, (const char *const *names, int count, int cursor), {
    const preferred = Module['preferredSaveSlot'];
    for (let index = 0; index < count; index++) {
        const name = HEAPU32[(names >>> 2) + index];
        if ((name ? UTF8ToString(name) : "") === preferred) return index;
    }
    return cursor;
});

EM_JS(void, web_set_options_title, (const char *title, bool defaults_saved), {
    Module['inputMenu'].options = UTF8ToString(title);
    Module['inputMenu'].defaultsSaved = !!defaults_saved;
});

EM_JS(void, set_menu_sections, (int current, int available, int equipment,
        int inventory, int floor, int quiver, int throwing), {
    const sections = [[inventory, "Inventory"], [equipment, "Equipment"],
        [quiver, "Quiver"], [floor, "Floor"], [throwing, "Throwing items"]];
    Module['inputMenu'].sections = sections.filter(([id]) => available & id)
        .map(([id, label]) => ({ id, label, active: id === current }));
});

void web_set_menu_sections(int current, int available)
{
    set_menu_sections(current, available, USE_EQUIP, USE_INVEN, USE_FLOOR, USE_QUIVER,
        SHOW_THROWING);
}

EM_JS(void, web_set_inven_burden, (const char *burden), {
    Module['inputMenu'].burden = UTF8ToString(burden).trimEnd();
});

EM_JS(void, web_set_store, (const char *name, bool home, bool inspect_only, bool item_actions), {
    Module['inputMenu'].store = { name: UTF8ToString(name), home: !!home,
        inspectOnly: !!inspect_only, itemActions: !!item_actions };
});

EM_JS(void, enter_store_menu, (void), {
    if (!Module['storeMenus']) Module['storeMenus'] = [];
    Module['storeMenus'].push(null);
});

void web_enter_store_menu(void)
{
    web_clear_displayed_messages();
    enter_store_menu();
}

EM_JS(void, leave_store_menu, (void), {
    Module['storeMenus'].pop();
});

void web_leave_store_menu(void)
{
    web_clear_displayed_messages();
    leave_store_menu();
}

EM_JS_DEPS(menu_description, "$UTF32ToString");
EM_JS(void, web_set_menu_description, (const wchar_t *description), {
    Module['inputMenu'].description = UTF32ToString(description);
});

EM_JS(void, web_add_menu_row, (int index, const char *name, const char *detail,
        const char *price, char key, bool enabled), {
    Module['inputMenu'].rows.push({ index, name: UTF8ToString(name),
        detail: detail ? UTF8ToString(detail).trim() : "",
        price: price ? UTF8ToString(price).trim() : "", key, enabled: !!enabled });
});

EM_JS(void, web_set_row_group, (const char *name, bool collapsible), {
    const row = Module['inputMenu'].rows.at(-1);
    row.group = UTF8ToString(name);
    row.collapsible = !!collapsible;
});

EM_JS(void, set_row_symbol, (int graphics, int attr, wchar_t symbol, const char *color), {
    Module['inputMenu'].rows.at(-1).visual = { graphics, attr, symbol, color: UTF8ToString(color) };
});

void web_set_row_symbol(int attr, wchar_t symbol)
{
    char color[8];
    web_text_color(color, sizeof(color), attr % MAX_COLORS);
    set_row_symbol(use_graphics, attr, symbol, color);
}

EM_JS(void, set_menu_row_color, (const char *color, bool unaffordable), {
    const row = Module['inputMenu'].rows.at(-1);
    row.color = UTF8ToString(color);
    row.unaffordable = !!unaffordable;
});

void web_set_menu_row_color(int attr, bool unaffordable)
{
    char color[8];
    web_text_color(color, sizeof(color), attr);
    set_menu_row_color(color, unaffordable);
}

EM_JS(void, set_menu_spell, (const char *info), {
    Module['inputMenu'].rows.at(-1).spellInfo = info ? UTF8ToString(info).trim() : "";
});

void web_set_menu_spell(const char *info, int attr)
{
    web_set_menu_row_color(attr, false);
    set_menu_spell(info);
}

EM_JS(void, web_menu_action, (int key, const char *label), {
    Module['inputMenu'].actions.push({ key, label: UTF8ToString(label) });
});

EM_JS(bool, web_has_mouse, (void), {
    return !!Module['mouseAvailable'];
});

void web_add_option_toggle(int row, const char *label, const char *detail, bool checked, bool enabled)
{
    web_add_menu_row(row, label, detail, checked ? "On" : "Off", 0, enabled);
    EM_ASM({
        Module['inputMenu'].rows.at(-1).checked = !!$0;
    }, checked);
}

EM_JS(void, set_birth_menu, (const char *title, const char *race, const char *class_name,
        bool method, int hit_die, const char *hometown, const char *thrall_start, int difficulty, int infra), {
    const menu = Module['inputMenu'];
    menu.birth = { title: UTF8ToString(title), race: UTF8ToString(race),
        className: class_name ? UTF8ToString(class_name) : "", hitDie: hit_die,
        hometown: hometown ? UTF8ToString(hometown) : "", thrallStart: thrall_start ? UTF8ToString(thrall_start) : "",
        difficulty, infravision: infra, stats: [], skills: [], abilities: [] };
    menu.choice = !!method;
});

EM_JS(void, add_birth_modifier, (bool stat, const char *label, int value), {
    const birth = Module['inputMenu'].birth;
    (stat ? birth.stats : birth.skills).push({ label: UTF8ToString(label), value });
});

EM_JS(void, add_birth_ability, (const char *name), {
    Module['inputMenu'].birth.abilities.push(UTF8ToString(name));
});

void web_set_birth_menu(const char *title, const struct player_race *race,
        const struct player_class *class, bool method)
{
    static const struct { int index; const char *label; } skills[] = {
        { SKILL_TO_HIT_MELEE, "Melee" }, { SKILL_TO_HIT_BOW, "Shooting" },
        { SKILL_TO_HIT_THROW, "Throwing" }, { SKILL_DISARM_PHYS, "Disarm – physical" },
        { SKILL_DISARM_MAGIC, "Disarm – magic" }, { SKILL_DEVICE, "Magic Devices" },
        { SKILL_SAVE, "Saving Throw" }, { SKILL_STEALTH, "Stealth" },
        { SKILL_DIGGING, "Digging" }, { SKILL_SEARCH, "Searching" }
    };
    bool wilderness = world && strstr(world->name, "Wilderness");
    set_birth_menu(title, race->name, class ? class->name : NULL, method,
        race->r_mhp + (class ? class->c_mhp : 0), wilderness ? race->hometown : NULL,
        wilderness && OPT(player, birth_thrall) ? THRALL_START_PLACE : NULL, race->difficulty,
        class ? -1 : race->infra * 10);
    for (int i = 0; i < STAT_MAX; i++) {
        char label[4];
        strnfmt(label, sizeof(label), "%.3s", stat_names[i]);
        add_birth_modifier(true, label, race->r_adj[i] + (class ? class->c_adj[i] : 0));
    }
    for (size_t i = 0; i < N_ELEMENTS(skills); i++) {
        int index = skills[i].index;
        add_birth_modifier(false, skills[i].label, race->r_skills[index] + (class ? class->c_skills[index] : 0));
    }
    if (class && class->magic.total_spells) {
        int count;
        struct magic_realm *realm = class_magic_realms(class, &count);
        while (realm) {
            add_birth_ability(format("Learns %s magic", realm->name));
            struct magic_realm *next = realm->next;
            mem_free(realm);
            realm = next;
        }
    }
    for (struct player_ability *ability = player_abilities; ability; ability = ability->next) {
        if (class ? class_has_ability(class, ability) : race_has_ability(race, ability))
            add_birth_ability(ability->name);
    }
}

EM_JS(void, web_set_birth_stats, (const char *race, const char *class_name, int remaining, int cursor), {
    Module['inputContext'] = { birthStats: { race: UTF8ToString(race), className: UTF8ToString(class_name),
        remaining, cursor, rows: [] } };
});

EM_JS(void, web_set_birth_roll, (bool previous, int hp, int mana), {
    Module['inputContext'].birthStats.roll = { previous: !!previous, hp, mana };
});

EM_JS(void, web_set_birth_name, (const char *name, size_t size), {
    Module['inputContext'].birthStats.name = UTF8ToString(name);
    Module['inputContext'].birthStats.nameMaxBytes = size - 1;
});

EM_JS(void, web_set_birth_history, (const char *history, size_t size), {
    Module['inputContext'].birthStats.history = history ? UTF8ToString(history) : "";
    Module['inputContext'].birthStats.historyMaxBytes = size - 1;
});

EM_JS(void, web_add_birth_stat, (const char *label, int base, const char *value, int cost,
        bool can_decrease, bool can_increase), {
    Module['inputContext'].birthStats.rows.push({ label: UTF8ToString(label), base,
        value: UTF8ToString(value).trim(), cost, canDecrease: !!can_decrease, canIncrease: !!can_increase });
});

void web_set_tiles(uint8_t id)
{
    graphics_mode *mode = get_graphics_mode(id);
    if (!mode || id == use_graphics) return;
    current_graphics_mode = mode;
    use_graphics = id;
    bool tiles = id != GRAPHICS_NONE;
    angband_term[0]->higher_pict = tiles;
    angband_term[WEB_MAP_TERM]->higher_pict = tiles;
    reset_visuals(true);

    for (int i = 1; i < cave_monster_max(cave); i++) {
        struct monster *mon = cave_monster(cave, i);
        if (mon->attr & 0x80) mon->attr = 0;
    }

    prt_map();
    Term_redraw_all();
}

EM_JS(void, send_frame, (int map, int width, int height, const wchar_t *chars,
        const int *attrs, const wchar_t *terrain_chars, const int *terrain_attrs,
        const uint8_t *colors, int color_count, int background_stride, int shade, int cursor, int graphics_mode,
        int player_x, int player_y, int player_place), {
    const cellCount = width * height;
    const codepoints = HEAPU32.slice(chars >>> 2, (chars >>> 2) + cellCount);
    const attributes = HEAP32.slice(attrs >>> 2, (attrs >>> 2) + cellCount);
    const palette = HEAPU8.slice(colors, colors + 4 * color_count);
    const frame = { surface: map ? "map" : "terminal",
        width, height, codepoints, attributes, palette,
        backgroundStride: background_stride, shade, cursor, graphicsMode: graphics_mode };
    if (player_place >= 0) frame.player = { x: player_x, y: player_y, placeId: player_place };
    if (terrain_attrs) {
        frame.terrainCodepoints = HEAPU32.slice(terrain_chars >>> 2, (terrain_chars >>> 2) + cellCount);
        frame.terrainAttributes = HEAP32.slice(terrain_attrs >>> 2, (terrain_attrs >>> 2) + cellCount);
    }
    Module['sendFrame'](frame);
});

EM_JS(void, send_quick_actions, (bool cast, bool fire, bool can_throw, bool breath, bool commanding,
        bool can_steal, bool can_reshape, bool can_move_house, const char *repeat), {
    Module['worldQuickActions'] = {
        cast: !!cast, fire: !!fire, throw: !!can_throw, breath: !!breath, commanding: !!commanding,
        canSteal: !!can_steal, canReshape: !!can_reshape, canMoveHouse: !!can_move_house,
        repeat: repeat ? UTF8ToString(repeat) : "", keymaps: [],
    };
});

EM_JS(void, add_quick_keymap, (int code, int mods, const char *key, const char *action), {
    const name = UTF8ToString(key);
    Module['worldQuickActions'].keymaps.push({
        id: "keymap:" + code + ":" + mods, code, mods, key: name,
        label: "Keymap " + name + " → " + UTF8ToString(action),
    });
});

static void publish_quick_keymap(struct keypress trigger, const struct keypress *actions)
{
    char key[80], sequence[512];
    keypress_to_readable(key, sizeof(key), trigger);
    keypress_to_text(sequence, sizeof(sequence), actions, true);
    add_quick_keymap(trigger.code, trigger.mods, key, sequence);
}

static bool has_action_item(item_tester eligible, int locations)
{
    if (locations & USE_INVEN) {
        for (int i = 0; i < z_info->pack_size; i++) {
            if (object_test(eligible, player->upkeep->inven[i])) return true;
        }
    }
    if (locations & USE_EQUIP) {
        for (int i = 0; i < player->body.count; i++) {
            if (object_test(eligible, slot_object(player, i))) return true;
        }
    }
    if (locations & USE_QUIVER) {
        for (int i = 0; i < z_info->quiver_size; i++) {
            if (object_test(eligible, player->upkeep->quiver[i])) return true;
        }
    }
    if (locations & USE_FLOOR) {
        for (struct object *obj = square_object(cave, player->grid); obj; obj = obj->next) {
            if (obj->known && obj->known->kind == obj->kind &&
                    !ignore_item_ok(player, obj) && object_test(eligible, obj)) return true;
        }
    }
    return false;
}

static bool can_cast_at_target(void)
{
    return !player_is_shapechanged(player) && player_can_cast(player, false) &&
        has_action_item(obj_can_cast_from, USE_INVEN | USE_FLOOR);
}

static bool can_fire_at_target(void)
{
    return !player_is_shapechanged(player) && player_can_fire(player, false) &&
        has_action_item(obj_can_fire, USE_INVEN | USE_QUIVER | USE_FLOOR);
}

static bool can_throw_at_target(void)
{
    return !player_is_shapechanged(player) &&
        has_action_item(obj_can_throw, USE_INVEN | USE_QUIVER | USE_FLOOR | USE_EQUIP);
}

static struct object *dragon_breath_armour(void)
{
    if (!player->shape->breath) return NULL;
    struct object *armour = equipped_item_by_slot_name(player, "body");
    struct effect *effect = armour ? object_effect(armour) : NULL;
    return effect && effect->index == EF_DRAGON && effect->subtype == player->shape->sidx ? armour : NULL;
}

static bool can_change_shape(void)
{
    return player_is_shapechanged(player) || player_has(player, PF_BEARSKIN);
}

static bool can_move_house(void)
{
    return player->place != player->home && level_topography(player->place) == TOP_TOWN;
}

static void publish_quick_actions(void)
{
    const struct object *armour = dragon_breath_armour();
    send_quick_actions(can_cast_at_target(), can_fire_at_target(), can_throw_at_target(), armour && obj_can_activate(armour),
        player->timed[TMD_COMMAND] != 0, player_has(player, PF_STEAL), can_change_shape(), can_move_house(),
        web_repeat_label());
    keymap_visit_custom(OPT(player, rogue_like_commands) ? KEYMAP_MODE_ROGUE : KEYMAP_MODE_ORIG, publish_quick_keymap);
}

enum { LOW_LIGHT_FUEL = 50 };

EM_JS(void, send_world, (int place_id, const char *place, int hp, int max_hp, int sp, int max_sp, int ac, bool low_hp,
        bool magic, const char *speed, const char *light, const char *food_grade, int food, int x, int y,
        const char *last_message, int repeat_count, bool roguelike, bool commands, int turns), {
    Module['sendWorld']({ placeId: place_id, place: UTF8ToString(place), hp, maxHp: max_hp, sp, maxSp: max_sp, ac, lowHp: !!low_hp,
        magic: !!magic, speed: UTF8ToString(speed), light: UTF8ToString(light),
        food, foodGrade: UTF8ToString(food_grade), x, y, roguelike: !!roguelike, turns,
        lastMessage: last_message ? { text: UTF8ToString(last_message), count: repeat_count } : null,
        conditions: Module['worldConditions'], stats: Module['worldStats'],
        mapStatus: Module['worldMapStatus'],
        monsterHealth: Module['worldMonsterHealth'],
        quickActions: commands ? Module['worldQuickActions'] : undefined,
    });
});

EM_JS(void, start_message_recall, (void), {
    Module['messageRecall'] = [];
});

EM_JS(void, add_recalled_message, (const char *text, int count, const char *color), {
    Module['messageRecall'].push({ text: UTF8ToString(text), count, color: UTF8ToString(color) });
});

EM_JS(void, finish_message_recall, (unsigned int request), {
    Module['sendMessageRecall'](request, Module['messageRecall']);
    Module['messageRecall'] = undefined;
});

static void collect_recalled_message(const char *text, uint16_t count, uint16_t type)
{
    char color[8];
    web_text_color(color, sizeof(color), message_type_color(type));
    add_recalled_message(text, count, color);
}

EMSCRIPTEN_KEEPALIVE void web_message_recall(unsigned int request)
{
    start_message_recall();
    messages_foreach(MESSAGE_OLDEST_FIRST, collect_recalled_message);
    finish_message_recall(request);
}

EM_JS(void, set_world_map_status, (int light, const char *terrain, const char *danger,
        const char *treasure, const char *danger_color, const char *treasure_color), {
    Module['worldMapStatus'] = {
        light, terrain: UTF8ToString(terrain), indicators: [],
        feeling: danger ? {
            danger: UTF8ToString(danger), treasure: UTF8ToString(treasure),
            dangerColor: UTF8ToString(danger_color), treasureColor: UTF8ToString(treasure_color),
        } : null,
    };
});

EM_JS(void, add_map_indicator, (const char *label, const char *color, const char *description), {
    Module['worldMapStatus'].indicators.push({
        label: UTF8ToString(label), color: UTF8ToString(color), description: UTF8ToString(description),
    });
});

EM_JS(void, set_explore_marks, (int x, int y, const int *cells, int count), {
    Module['worldMapStatus'].discoveries = { x, y, cells: new Set(HEAP32.subarray(cells >>> 2, (cells >>> 2) + count)) };
});

static void publish_map_indicator(const char *label, int attr, const char *description)
{
    char color[8];
    web_text_color(color, sizeof(color), attr);
    add_map_indicator(label, color, description);
}

static void publish_map_status(void)
{
    struct loc grid = player->grid;
    const struct trap *trap = square_trap(cave, grid);
    char terrain[80];
    struct level_feeling_display feeling;
    bool show_feeling = get_level_feeling(&feeling);

    char danger_color[8], treasure_color[8];
    if (show_feeling) {
        web_text_color(danger_color, sizeof(danger_color), feeling.danger_attr);
        web_text_color(treasure_color, sizeof(treasure_color), feeling.treasure_attr);
    }
    my_strcpy(terrain, (trap && !square_isinvis(cave, grid)) ?
        trap->kind->name : square_feat(cave, grid)->name, sizeof(terrain));
    my_strcap(terrain);
    set_world_map_status(square_light(cave, grid), terrain,
        show_feeling ? feeling.danger : NULL, show_feeling ? feeling.treasure : NULL,
        danger_color, treasure_color);

    if (outside()) {
        char clock[32];
        format_game_time(clock, sizeof(clock));
        publish_map_indicator(clock, COLOUR_WHITE, is_daytime() ? "Daytime" : "Night");
    }
    if (player_has(player, PF_TRAP)) {
        publish_map_indicator(format("Traps %d/%d", player->num_traps, monster_trap_limit()),
            COLOUR_WHITE, "Monster traps set on this level");
    }
    if (player->state.shield_on_back && equipped_item_by_slot_name(player, "arm"))
        publish_map_indicator("Shield on back", COLOUR_YELLOW, "Reduced armor class and no shield bash");
    if (player->timed[TMD_COMMAND]) {
        const struct monster *mon = get_commanded_monster();
        char label[128] = "Command monster";
        if (mon && monster_is_obvious(mon) && !player->timed[TMD_IMAGE]) {
            char name[96];
            monster_desc(name, sizeof(name), mon, MDESC_TARG);
            strnfmt(label, sizeof(label), "Commanding %s", name);
        }
        publish_map_indicator(label, COLOUR_L_BLUE, "Directions move the commanded monster");
    }
    int moves = player->state.num_moves;
    if (player_is_shapechanged(player)) {
        char form[80];
        strnfmt(form, sizeof(form), "%s form", player->shape->name);
        my_strcap(form);
        publish_map_indicator(form, COLOUR_L_GREEN, "Current shape");
        const struct object *armour = dragon_breath_armour();
        if (armour && armour->timeout)
            publish_map_indicator("Breath recharging", COLOUR_YELLOW, "Dragon scale mail is recharging");
    }
    if (moves)
        publish_map_indicator(format("Moves %+d", moves), COLOUR_L_TEAL, "Movement speed");
    if (player->unignoring)
        publish_map_indicator("Unignoring", COLOUR_WHITE, "Ignoring is temporarily disabled");
    if (player->upkeep->new_specialties)
        publish_map_indicator(format("Spec. (%d)", player->upkeep->new_specialties),
            COLOUR_L_GREEN, "Specialty available");
    if (player->upkeep->new_spells) {
        bool can_study = player_book_has_unlearned_spells(player);
        publish_map_indicator(format("Study (%d)", player->upkeep->new_spells),
            can_study ? COLOUR_WHITE : COLOUR_L_DARK,
            can_study ? "New spells available" : "No carried book with spells to study");
    }
    if (square_isdtrap(cave, grid)) {
        bool edge = square_dtrap_edge(cave, grid);
        publish_map_indicator("DTrap", edge ? COLOUR_YELLOW : COLOUR_L_GREEN,
            edge ? "Edge of trap-detected area" : "Trap-detected area");
    }
}

EM_JS(void, start_world_status, (void), {
    Module['worldConditions'] = [];
    Module['worldStats'] = [];
    Module['worldMonsterHealth'] = null;
});

EM_JS(void, add_world_condition, (const char *label, int priority), {
    Module['worldConditions'].push({ label: UTF8ToString(label), priority });
});

EM_JS(void, add_world_stat, (const char *label, const char *value, bool reduced, bool lowered), {
    Module['worldStats'].push({
        label: UTF8ToString(label), value: UTF8ToString(value).trim(), reduced: !!reduced, lowered: !!lowered,
    });
});

EM_JS(void, set_world_monster_health, (const char *name, int segments, const char *color), {
    Module['worldMonsterHealth'] = {
        name: name ? UTF8ToString(name) : null, segments,
        color: color ? UTF8ToString(color) : null,
    };
});

static void publish_monster_health(void)
{
    const struct monster *mon = player->upkeep->health_who;
    if (!mon) return;
    if (!mon->race || !monster_is_visible(mon) || player->timed[TMD_IMAGE] ||
            mon->hp < 0 || mon->maxhp <= 0) {
        set_world_monster_health(NULL, 0, NULL);
        return;
    }
    int pct = 100L * mon->hp / mon->maxhp;
    int segments = (pct < 10) ? 1 : (pct < 90) ? pct / 10 + 1 : 10;
    char color[8];
    web_text_color(color, sizeof(color), monster_health_attr());
    set_world_monster_health(mon->race->name, segments, color);
}

static void publish_stats(bool commands)
{
    static bool have_stats;
    static int previous_cur[STAT_MAX], previous_max[STAT_MAX];

    for (int stat = 0; stat < STAT_MAX; ++stat) {
        char label[4], value[8];
        int cur = player->stat_cur[stat], max = player->stat_max[stat];
        int use = player->state.stat_use[stat];
        bool lower_max = commands && have_stats && max < previous_max[stat];
        bool lower_cur = commands && have_stats && cur < previous_cur[stat];
        strnfmt(label, sizeof(label), "%.3s", stat_names[stat]);
        cnv_stat(use, value, sizeof(value));
        add_world_stat(label, value, cur < max, lower_cur || lower_max);
        if (commands) {
            previous_cur[stat] = cur;
            previous_max[stat] = max;
        }
    }
    if (commands) have_stats = true;
}

static void publish_world(bool commands)
{
    const term *map = angband_term[WEB_MAP_TERM];
    char speed[32], light_name[160];
    struct object *light = equipped_item_by_slot_name(player, "light");
    int speed_offset = player->state.speed - 110;
    bool magic = player->class->magic.total_spells > 0;
    const char *food_grade = "";

    start_world_status();
    publish_map_status();
    const struct point_set *marks = player->upkeep->explore_marks;
    if (marks && marks->n) {
        int cells[marks->n], count = 0;
        for (int i = 0; i < marks->n; ++i) {
            int x = (marks->pts[i].x - map->offset_x) * tile_width;
            int y = (marks->pts[i].y - map->offset_y) * tile_height;
            if (x >= 0 && x < map->wid && y >= 0 && y < map->hgt)
                cells[count++] = y * map->wid + x;
        }
        set_explore_marks((player->grid.x - map->offset_x) * tile_width,
            (player->grid.y - map->offset_y) * tile_height, cells, count);
    }
    publish_stats(commands);
    publish_monster_health();
    if (player->word_recall) add_world_condition("Recall", 55);
    if (player->deep_descent) add_world_condition("Descent", 55);
    for (int effect = 0; effect < TMD_MAX; ++effect) {
        if (!player->timed[effect]) continue;
        struct timed_grade *grade = timed_effects[effect].grade;
        while (grade && player->timed[effect] > grade->max) grade = grade->next;
        if (!grade || !grade->name) continue;

        int priority = 0;
        switch (effect) {
            case TMD_PARALYZED: priority = 100; break;
            case TMD_BLACKBREATH: priority = 97; break;
            case TMD_CONFUSED: priority = 95; break;
            case TMD_BLIND: priority = 90; break;
            case TMD_POISONED: priority = 85; break;
            case TMD_CUT:
                priority = !grade->next ? 105 : grade->color == COLOUR_RED ? 98 : 80;
                break;
            case TMD_STUN:
                priority = !grade->next ? 105 : 75;
                break;
            case TMD_SLOW: priority = 65; break;
            case TMD_TERROR:
            case TMD_IMAGE:
            case TMD_AFRAID:
            case TMD_AMNESIA:
                priority = 70; break;
            case TMD_FOOD:
                food_grade = grade->name;
                if (streq(grade->name, "Fed")) continue;
                priority = player->timed[effect] <= PY_FOOD_FAINT ? 96 : 50;
                break;
        }
        add_world_condition(effect == TMD_BLACKBREATH ? "Black Breath" : grade->name, priority);
    }
    object_desc(light_name, sizeof(light_name), light, ODESC_BASE | ODESC_COMBAT, player);

    my_strcpy(speed, "Normal", sizeof(speed));
    if (speed_offset) {
        const char *label = speed_offset > 0 ? "Fast" : "Slow";
        if (OPT(player, effective_speed)) {
            int multiplier = 10 * extract_energy[player->state.speed] / extract_energy[110];
            strnfmt(speed, sizeof(speed), "%s (%d.%dx)", label, multiplier / 10, multiplier % 10);
        } else {
            strnfmt(speed, sizeof(speed), "%s (%+d)", label, speed_offset);
        }
    }

    if (commands) publish_quick_actions();
    send_world(player->place, level_name(&world->levels[player->place]), player->chp, player->mhp, player->csp, player->msp,
        player->known_state.ac + player->known_state.to_a, player_hp_attr(player) == COLOUR_RED,
        magic, speed, light_name,
        food_grade, player->timed[TMD_FOOD] / 100,
        player->grid.x - map->offset_x, player->grid.y - map->offset_y,
        messages_num() ? message_str(0) : NULL, message_count(0),
        OPT(player, rogue_like_commands), commands, player->total_energy / 100);
}

static double last_interrupt_poll;

static struct loc web_map_grid(int x, int y)
{
    const term *map = angband_term[WEB_MAP_TERM];
    return loc(map->offset_x + x / tile_width, map->offset_y + y / tile_height);
}

static bool web_has_overhead_map(void)
{
    return window_flag[WEB_MAP_TERM] == PW_OVERHEAD && textui_map_is_visible();
}

void web_resize_map(void)
{
    term *map = angband_term[WEB_MAP_TERM];
    term *previous = Term;
    Term_activate(map);
    Term_resize(cave->width * tile_width, cave->height * tile_height);
    Term_activate(previous);
}

struct loc web_direction_grid(int x, int y)
{
    if (direction_command == CMD_RUN && web_has_overhead_map()) return web_map_grid(x, y);
    return loc(Term->offset_x + (x - COL_MAP) / tile_width,
        Term->offset_y + (y - ROW_MAP) / tile_height);
}

static bool has_aim_target(void)
{
    for (int i = 1; i < cave_monster_max(cave); i++) {
        struct monster *mon = cave_monster(cave, i);
        if (square_in_bounds_fully(cave, mon->grid) && target_able(mon)) return true;
    }
    return false;
}

void web_set_aim_options(bool selecting, struct loc location)
{
    const bool overhead = web_has_overhead_map();
    const term *map = overhead ? angband_term[WEB_MAP_TERM] : Term;
    const int origin_x = overhead ? 0 : COL_MAP;
    const int origin_y = overhead ? 0 : ROW_MAP;
    const bool current = location.x || target_okay();
    struct loc grid = location;
    if (!location.x) target_get(&grid);

    int path_count = 0;
    int path_cells[z_info->max_range];
    if (current) {
        struct loc path[z_info->max_range];
        int count = project_path(cave, path, z_info->max_range, player->grid, grid, PROJECT_INFO);
        for (int i = 0; i < count; i++) {
            int x = origin_x + (path[i].x - map->offset_x) * tile_width;
            int y = origin_y + (path[i].y - map->offset_y) * tile_height;
            if (x >= 0 && x < map->wid && y >= 0 && y < map->hgt)
                path_cells[path_count++] = y * map->wid + x;
        }
    }
    char description[192] = "";
    if (current) {
        struct monster *mon = square_monster(cave, grid);
        if (target_able(mon)) monster_desc(description, sizeof(description), mon, MDESC_IND_VIS);
        else coords_desc(description, sizeof(description), grid.y, grid.x);
    }
    set_aim_options(current, has_aim_target(), selecting,
        origin_x + (grid.x - map->offset_x) * tile_width,
        origin_y + (grid.y - map->offset_y) * tile_height, path_cells, path_count, description);
}

static bool aim_at_grid(struct loc grid, struct loc *location)
{
    if (!square_in_bounds_fully(cave, grid)) return false;
    struct monster *mon = square_monster(cave, grid);
    if (!target_able(mon)) {
        *location = grid;
        return false;
    }
    target_set_monster(mon);
    monster_race_track(player->upkeep, mon->race);
    health_track(player->upkeep, mon);
    *location = loc(0, 0);
    return true;
}

bool web_aim_at_cell(int x, int y, struct loc *location)
{
    struct loc grid = web_has_overhead_map() ? web_map_grid(x, y) :
        loc(Term->offset_x + (x - COL_MAP) / tile_width,
            Term->offset_y + (y - ROW_MAP) / tile_height);
    return aim_at_grid(grid, location);
}

void web_move_aim(int direction, struct loc *location)
{
    struct loc grid = *location;
    if (!grid.x) target_get(&grid);
    grid = loc_sum(grid, ddgrid[direction]);
    const bool overhead = web_has_overhead_map();
    const term *map = overhead ? angband_term[WEB_MAP_TERM] : Term;
    int width = overhead ? map->wid / tile_width : SCREEN_WID;
    int height = overhead ? map->hgt / tile_height : SCREEN_HGT;
    if (grid.x < map->offset_x || grid.x >= map->offset_x + width ||
            grid.y < map->offset_y || grid.y >= map->offset_y + height) return;
    aim_at_grid(grid, location);
}

enum web_map_action {
    MAP_EAT, MAP_REFILL, MAP_EQUIP_LIGHT, MAP_PICKUP, MAP_GO_UP, MAP_GO_DOWN,
    MAP_OPEN, MAP_CLOSE, MAP_DISARM, MAP_TUNNEL, MAP_OPEN_CHEST, MAP_DISARM_CHEST,
    MAP_STUDY, MAP_LEARN_SPECIALTY, MAP_REST, MAP_JUMP, MAP_WALK, MAP_ATTACK, MAP_STEAL, MAP_FIRE, MAP_CAST,
    MAP_THROW, MAP_DETAILS, MAP_INSPECT, MAP_FLOOR, MAP_SET_TRAP, MAP_IMPROVE_TRAP,
    MAP_CHANGE_SHAPE, MAP_MOVE_HOUSE, MAP_USE, MAP_LOCK, MAP_BREATHE, MAP_ACTION_COUNT
};

static const char *const map_action_labels[MAP_ACTION_COUNT] = {
    [MAP_EAT] = "Eat", [MAP_REFILL] = "Refill", [MAP_EQUIP_LIGHT] = "Equip light source",
    [MAP_PICKUP] = "Pick up", [MAP_GO_UP] = "Go up staircase",
    [MAP_GO_DOWN] = "Go down staircase",
    [MAP_OPEN] = "Open", [MAP_CLOSE] = "Close", [MAP_DISARM] = "Disarm", [MAP_TUNNEL] = "Tunnel",
    [MAP_OPEN_CHEST] = "Open Chest", [MAP_DISARM_CHEST] = "Disarm Chest", [MAP_STUDY] = "Study",
    [MAP_LEARN_SPECIALTY] = "Learn specialty", [MAP_REST] = "Rest",
    [MAP_JUMP] = "Walk into a trap", [MAP_WALK] = "Walk",
    [MAP_ATTACK] = "Attack", [MAP_STEAL] = "Steal",
    [MAP_FIRE] = "Fire", [MAP_CAST] = "Cast", [MAP_THROW] = "Throw",
    [MAP_DETAILS] = "Details", [MAP_INSPECT] = "Inspect", [MAP_FLOOR] = "Floor",
    [MAP_SET_TRAP] = "Set trap", [MAP_IMPROVE_TRAP] = "Improve trap",
    [MAP_CHANGE_SHAPE] = "Change shape", [MAP_MOVE_HOUSE] = "Move house",
    [MAP_USE] = "Use Item On", [MAP_LOCK] = "Lock", [MAP_BREATHE] = "Breathe",
};

static const cmd_code map_action_commands[MAP_ACTION_COUNT] = {
    [MAP_EAT] = CMD_EAT, [MAP_REFILL] = CMD_REFILL, [MAP_EQUIP_LIGHT] = CMD_WIELD,
    [MAP_PICKUP] = CMD_PICKUP, [MAP_GO_UP] = CMD_GO_UP, [MAP_GO_DOWN] = CMD_GO_DOWN,
    [MAP_OPEN] = CMD_OPEN,
    [MAP_CLOSE] = CMD_CLOSE, [MAP_DISARM] = CMD_DISARM, [MAP_TUNNEL] = CMD_TUNNEL,
    [MAP_OPEN_CHEST] = CMD_OPEN, [MAP_DISARM_CHEST] = CMD_DISARM, [MAP_STUDY] = CMD_STUDY,
    [MAP_JUMP] = CMD_JUMP, [MAP_WALK] = CMD_WALK,
    [MAP_ATTACK] = CMD_ALTER, [MAP_STEAL] = CMD_STEAL, [MAP_FIRE] = CMD_FIRE, [MAP_CAST] = CMD_CAST,
    [MAP_THROW] = CMD_THROW,
    [MAP_SET_TRAP] = CMD_ALTER, [MAP_IMPROVE_TRAP] = CMD_ALTER,
    [MAP_CHANGE_SHAPE] = CMD_RESHAPE, [MAP_MOVE_HOUSE] = CMD_MOVE,
    [MAP_USE] = CMD_USE, [MAP_LOCK] = CMD_DISARM, [MAP_BREATHE] = CMD_ACTIVATE,
};

static bool map_cell_adjacent(struct loc grid)
{
    return !loc_eq(grid, player->grid) &&
        ABS(grid.x - player->grid.x) <= 1 && ABS(grid.y - player->grid.y) <= 1;
}

static struct monster *obvious_map_monster(struct loc grid)
{
    struct monster *mon = square_monster(cave, grid);
    return mon && monster_is_obvious(mon) ? mon : NULL;
}

bool web_can_equip_light(const struct object *obj)
{
    return tval_is_light(obj) && obj_can_wear(obj) && (obj->timeout > 0 ||
        (obj->known && of_has(obj->known->flags, OF_NO_FUEL)));
}

static unsigned player_map_actions(struct loc grid, int object_count)
{
    struct chunk *known = player->cave;
    struct object *light = equipped_item_by_slot_name(player, "light");
    const int pack_and_floor = USE_INVEN | USE_FLOOR;
    const int supplies = pack_and_floor | USE_QUIVER;
    int food_locations = player_is_shapechanged(player) ? USE_FLOOR : pack_and_floor;
    unsigned actions = 1U << MAP_REST;

    if (player->timed[TMD_FOOD] <= PY_FOOD_HUNGRY && has_action_item(tval_is_edible, food_locations))
        actions |= 1U << MAP_EAT;
    if (light && !of_has(light->flags, OF_NO_FUEL) && light->timeout < LOW_LIGHT_FUEL &&
            player_can_refuel(player, false) && has_action_item(obj_can_refill, supplies))
        actions |= 1U << MAP_REFILL;
    else if ((!light || (!of_has(light->flags, OF_NO_FUEL) && !light->timeout)) &&
            has_action_item(web_can_equip_light, supplies))
        actions |= 1U << MAP_EQUIP_LIGHT;
    if (object_count) {
        actions |= 1U << MAP_PICKUP;
        if (!player->timed[TMD_IMAGE])
            actions |= 1U << (object_count == 1 ? MAP_INSPECT : MAP_FLOOR);
    }
    if (square_isupstairs(known, grid)) actions |= 1U << MAP_GO_UP;
    if (square_isdownstairs(known, grid)) actions |= 1U << MAP_GO_DOWN;
    if (!player->timed[TMD_IMAGE] && count_feats(NULL, square_isdiggable, false))
        actions |= 1U << MAP_TUNNEL;
    if (player_can_study(player, false) && has_action_item(obj_can_study, pack_and_floor))
        actions |= 1U << MAP_STUDY;
    if (player->upkeep->new_specialties > 0) actions |= 1U << MAP_LEARN_SPECIALTY;
    struct object *armour = dragon_breath_armour();
    if (armour && obj_can_activate(armour)) actions |= 1U << MAP_BREATHE;
    if (can_change_shape()) actions |= 1U << MAP_CHANGE_SHAPE;
    if (can_move_house()) actions |= 1U << MAP_MOVE_HOUSE;
    return actions;
}

static unsigned nearby_map_actions(struct loc grid, struct object *const *objects, int object_count)
{
    struct chunk *known = player->cave;
    unsigned actions = 0;
    for (int i = 0; i < object_count; i++) {
        const struct object *obj = objects[i];
        if (!tval_is_chest(obj)) continue;
        if (obj->pval) actions |= 1U << MAP_OPEN_CHEST;
        if (is_trapped_chest(obj) && obj->known && is_trapped_chest(obj->known))
            actions |= 1U << MAP_DISARM_CHEST;
    }
    if (loc_eq(grid, player->grid) || !square_isknown(known, grid)) return actions;

    if (square_iscloseddoor(known, grid) && !(actions & (1U << MAP_OPEN_CHEST))) {
        actions |= 1U << MAP_OPEN;
        if (!square_islockeddoor(known, grid)) actions |= 1U << MAP_LOCK;
    }
    if (square_isopendoor(known, grid)) actions |= 1U << MAP_CLOSE;
    if ((square_isdisarmabletrap(known, grid) || square_ismonstertrap(known, grid)) &&
            !(actions & (1U << MAP_DISARM_CHEST)))
        actions |= 1U << MAP_DISARM;
    if (player->timed[TMD_BLIND] || player->timed[TMD_CONFUSED] || no_light(player)) return actions;
    if (square_isbasicmonstertrap(known, grid)) {
        actions |= 1U << MAP_IMPROVE_TRAP;
    } else if (player_has(player, PF_TRAP) && square_player_trap_allowed(known, grid) &&
            !square_isdiggable(known, grid) && !square_iscloseddoor(known, grid) &&
            player->num_traps < monster_trap_limit()) {
        actions |= 1U << MAP_SET_TRAP;
    }
    return actions;
}

struct map_action_cell {
    int x, y;
    unsigned actions;
};

static unsigned player_nearby_actions(struct map_action_cell *cells, unsigned underfoot)
{
    const term *map = angband_term[WEB_MAP_TERM];
    struct object *objects[z_info->floor_size];
    const unsigned terrain = (1U << MAP_OPEN) | (1U << MAP_CLOSE);
    unsigned seen = 0, prompt = 0;
    for (int dir = DIR_SW; dir <= DIR_NE; dir++) {
        struct loc grid = next_grid(player->grid, dir);
        int x = (grid.x - map->offset_x) * tile_width;
        int y = (grid.y - map->offset_y) * tile_height;
        if (x < 0 || x >= map->wid || y < 0 || y >= map->hgt ||
                !square_in_bounds_fully(cave, grid)) continue;
        unsigned actions = underfoot;
        if (obvious_map_monster(grid)) {
            if (player_has(player, PF_STEAL)) prompt |= 1U << MAP_STEAL;
            continue;
        }
        if (dir != DIR_TARGET) {
            int count = scan_distant_floor(objects, N_ELEMENTS(objects), player, grid);
            actions = nearby_map_actions(grid, objects, count);
        }
        cells[dir] = (struct map_action_cell){ x, y, actions };
        prompt |= seen & actions & terrain;
        seen |= actions;
    }
    return underfoot | prompt;
}

static unsigned map_actions(struct loc grid, struct monster *mon, struct object *const *objects,
        int object_count, bool quick, struct map_action_cell *nearby)
{
    struct chunk *known = player->cave;
    unsigned actions = 0;
    if (player->timed[TMD_COMMAND])
        return mon && !player->timed[TMD_IMAGE] ? 1U << MAP_DETAILS : 0;
    if (loc_eq(grid, player->grid)) {
        actions = player_map_actions(grid, object_count);
        if (!player->timed[TMD_IMAGE])
            actions |= player_nearby_actions(nearby, nearby_map_actions(grid, objects, object_count));
        return actions;
    }
    if (player->timed[TMD_IMAGE]) return 0;
    bool adjacent = map_cell_adjacent(grid);
    if (mon) {
        actions = 1U << MAP_DETAILS;
        if (adjacent) {
            actions |= 1U << MAP_ATTACK;
            if (player_has(player, PF_STEAL)) actions |= 1U << MAP_STEAL;
        }
    }
    if ((mon && target_able(mon)) || (!mon && !quick && square_in_bounds_fully(cave, grid))) {
        if (can_fire_at_target()) actions |= 1U << MAP_FIRE;
        if (can_cast_at_target()) actions |= 1U << MAP_CAST;
        if (can_throw_at_target()) actions |= 1U << MAP_THROW;
        if (!quick && !player_is_shapechanged(player) &&
                has_action_item(obj_is_useable, USE_INVEN | USE_EQUIP | USE_QUIVER | USE_FLOOR))
            actions |= 1U << MAP_USE;
    }
    if (mon) return actions;
    if (adjacent) {
        actions |= nearby_map_actions(grid, objects, object_count);
        if (quick) actions &= ~((1U << MAP_SET_TRAP) | (1U << MAP_IMPROVE_TRAP) | (1U << MAP_LOCK));
        if (square_isdiggable(known, grid) &&
                (!quick || square_isrubble(known, grid) || square_hasgoldvein(known, grid)))
            actions |= 1U << MAP_TUNNEL;
        if (square_isdisarmabletrap(known, grid)) actions |= 1U << MAP_JUMP;
        if (square_isknownpassable(known, grid) && !square_isvisibletrap(known, grid))
            actions |= 1U << MAP_WALK;
    }
    if (object_count == 1) actions |= 1U << MAP_INSPECT;
    return actions;
}

EM_JS(void, set_map_cell, (int x, int y, const char *description, bool here, bool menu), {
    const mapCell = { x, y, here: !!here, description: UTF8ToString(description) };
    if (menu) mapCell.actions = [];
    Module['inputContext'] = { mapCell };
});

EM_JS(void, set_map_route_available, (bool available), {
    Module['inputContext'].mapCell.canRoute = !!available;
});

EM_JS(void, add_map_action, (int x, int y, int direction, int code, const char *label, int key,
        const char *key_sequence, const char *detail), {
    const actions = Module['inputContext'].mapCell.actions;
    let action = actions.find((entry) => entry.code === code);
    if (!action) {
        action = { code, label: UTF8ToString(label), key };
        if (detail) action.detail = UTF8ToString(detail);
        if (key_sequence) action.keySequence = UTF8ToString(key_sequence);
        actions.push(action);
    }
    if (direction) {
        if (!action.targets) action.targets = [];
        action.targets.push({ x, y, direction });
    }
});

static void describe_map_actions(int x, int y, int direction, unsigned enabled)
{
    int keymap = OPT(player, rogue_like_commands) ? KEYMAP_MODE_ROGUE : KEYMAP_MODE_ORIG;
    for (int code = 0; code < MAP_ACTION_COUNT; code++) {
        if (!(enabled & (1U << code))) continue;
        cmd_code command = map_action_commands[code];
        int key = code == MAP_REST ? 'R' : command != CMD_NULL ? cmd_lookup_key(command, keymap) : 0;
        const char *label = map_action_labels[code];
        char path[160];
        struct loc grid = web_map_grid(x, y);
        if ((code == MAP_GO_UP || code == MAP_GO_DOWN) && square_ispath(player->cave, grid)) {
            const char *heading = path_direction(square_feat(player->cave, grid)->fidx);
            int destination = player_get_next_place(player->place, heading, 1);
            if (destination >= 0) {
                strnfmt(path, sizeof(path), "Follow path %s · %s", heading, level_name(&world->levels[destination]));
                label = path;
            }
        }
        const char *detail = (code == MAP_EQUIP_LIGHT || code == MAP_REFILL) && player_has(player, PF_UNLIGHT) ?
            "Unlight increases spell failure on lit squares." : NULL;
        const char *key_sequence = code == MAP_LEARN_SPECIALTY ? "S → l" : NULL;
        if (code == MAP_INSPECT) key_sequence = "I -";
        add_map_action(x, y, direction, code, label, key, key_sequence, detail);
    }
}

static void describe_map_cell(int x, int y, struct loc grid, bool menu, unsigned actions,
        struct monster *mon, struct object **objects, int count, const struct map_action_cell *nearby)
{
    bool here = loc_eq(player->grid, grid);
    const char *phrase = here ? "You are on " : square_isseen(cave, grid) ? "You see " :
        mon ? "You sense " : "You recall ";
    const char *article = "";
    char name[160];

    if (player->timed[TMD_IMAGE]) {
        my_strcpy(name, "something strange", sizeof(name));
    } else if (mon) {
        monster_desc(name, sizeof(name), mon, MDESC_IND_VIS);
    } else if (square_isvisibletrap(player->cave, grid)) {
        const char *trap_name = square(player->cave, grid)->trap->kind->desc;
        article = is_a_vowel(trap_name[0]) ? "an " : "a ";
        my_strcpy(name, trap_name, sizeof(name));
    } else {
        if (count > 1) {
            strnfmt(name, sizeof(name), "a pile of %d objects", count);
        } else if (count == 1) {
            object_desc(name, sizeof(name), objects[0], ODESC_PREFIX | ODESC_FULL, player);
        } else {
            if (here) phrase = "You are ";
            strnfmt(name, sizeof(name), "%s%s%s",
                here ? square_apparent_look_in_preposition(player->cave, grid) : "",
                square_apparent_look_prefix(player->cave, grid),
                square_apparent_name(player->cave, grid));
        }
    }

    char coordinates[32], description[224];
    coords_desc(coordinates, sizeof(coordinates), grid.y, grid.x);
    strnfmt(description, sizeof(description), "%s%s%s, %s.", phrase, article, name, coordinates);
    set_map_cell(x, y, description, here, menu);
    if (!menu) return;
    unsigned untargeted = actions & ~nearby[DIR_TARGET].actions;
    describe_map_actions(x, y, 0, untargeted);
    if (here) {
        for (int dir = DIR_SW; dir <= DIR_NE; dir++) {
            const struct map_action_cell *cell = &nearby[dir];
            unsigned targeted = cell->actions & ~untargeted;
            if (targeted) describe_map_actions(cell->x, cell->y, dir, targeted);
        }
    }
}

static bool queue_map_command(cmd_code command, struct loc grid)
{
    if (cmdq_push(command)) return false;
    if (!loc_eq(grid, player->grid) && (command == CMD_WALK || command == CMD_JUMP ||
            command == CMD_ALTER || command == CMD_OPEN || command == CMD_CLOSE ||
            command == CMD_DISARM || command == CMD_STEAL || command == CMD_TUNNEL)) {
        cmd_set_arg_direction(cmdq_peek(), "direction", motion_dir(player->grid, grid));
    } else if (command == CMD_PATHFIND) {
        cmd_set_arg_point(cmdq_peek(), "point", grid);
        pace_run = true;
    } else if (command == CMD_FIRE || command == CMD_CAST || command == CMD_THROW || command == CMD_USE) {
        cmd_set_arg_point(cmdq_peek(), "map target", grid);
    }
    return true;
}

bool web_map_cell(int x, int y, int gesture)
{
    struct loc grid = web_map_grid(x, y);
    if (!square_in_bounds(cave, grid)) return false;
    bool here = loc_eq(grid, player->grid);
    bool inspect = gesture == WEB_MAP_INSPECT ||
        ((gesture == WEB_MAP_MOUSE_TAP || gesture == WEB_MAP_MOUSE_REPEAT) &&
            !OPT(player, mouse_movement));
    bool direct_move = !inspect && gesture != WEB_MAP_HOLD;
    bool repeat = gesture == WEB_MAP_REPEAT || gesture == WEB_MAP_MOUSE_REPEAT;
    bool adjacent = map_cell_adjacent(grid);
    struct monster *mon = obvious_map_monster(grid);
    struct object *objects[z_info->floor_size];
    int count = scan_distant_floor(objects, N_ELEMENTS(objects), player, grid);
    struct chunk *known = player->cave;
    if (player->timed[TMD_COMMAND]) {
        struct monster *controlled = get_commanded_monster();
        if (direct_move && !player->timed[TMD_IMAGE] && controlled && monster_is_obvious(controlled) &&
                ABS(grid.x - controlled->grid.x) <= 1 && ABS(grid.y - controlled->grid.y) <= 1) {
            int dir = loc_eq(grid, controlled->grid) ? DIR_TARGET : motion_dir(controlled->grid, grid);
            return web_quick_action('0' + dir);
        }
        direct_move = false;
    }
    if (direct_move && adjacent && square_in_bounds_fully(cave, grid) &&
            !player->timed[TMD_IMAGE] && !mon && !count && square_isfloor(known, grid) &&
            !square_isvisibletrap(known, grid)) {
        return queue_map_command(CMD_WALK, grid);
    }
    struct map_action_cell nearby[DIR_NE + 1] = { 0 };
    unsigned actions = map_actions(grid, mon, objects, count, gesture != WEB_MAP_HOLD, nearby);
    bool menu = gesture == WEB_MAP_HOLD || here || (actions && (adjacent || mon));
    if (!menu && direct_move && repeat && square_in_bounds_fully(cave, grid))
        return queue_map_command(adjacent ? CMD_WALK : CMD_PATHFIND, grid);
    describe_map_cell(x, y, grid, menu, actions, mon, objects, count, nearby);
    set_map_route_available(direct_move && !menu && square_in_bounds_fully(cave, grid));
    return false;
}

bool web_act_on_map_cell(int x, int y, int action)
{
    struct loc grid = web_map_grid(x, y);
    if (!square_in_bounds(cave, grid) || action < 0 || action >= MAP_ACTION_COUNT) return false;
    struct monster *mon = obvious_map_monster(grid);
    struct object *objects[z_info->floor_size];
    int count = scan_distant_floor(objects, N_ELEMENTS(objects), player, grid);
    struct map_action_cell nearby[DIR_NE + 1] = { 0 };
    if (!(map_actions(grid, mon, objects, count, false, nearby) & (1U << action))) return false;
    if (action == MAP_LEARN_SPECIALTY) {
        if (!key_confirm_command('S')) return false;
        gain_specialty();
        return true;
    }
    if (action == MAP_REST) {
        if (!key_confirm_command('R')) return false;
        textui_cmd_rest();
        return true;
    }
    if (action == MAP_DETAILS || action == MAP_INSPECT || action == MAP_FLOOR) {
        if (action == MAP_DETAILS) lore_show_interactive(mon->race, get_lore(mon->race));
        else if (action == MAP_FLOOR) web_inspect_floor(player, objects, count);
        else display_object_recall_interactive(objects[0]);
        web_map_cell(x, y, WEB_MAP_HOLD);
        return false;
    }
    int keymap = OPT(player, rogue_like_commands) ? KEYMAP_MODE_ROGUE : KEYMAP_MODE_ORIG;
    cmd_code command = map_action_commands[action];
    int key = cmd_lookup_key(command, keymap);
    if (!key_confirm_command(key)) return false;
    struct object *armour = NULL;
    if (action == MAP_BREATHE) {
        armour = dragon_breath_armour();
        if (!armour || !get_item_allow(armour, key, command, false)) return false;
    }
    if (!queue_map_command(command, grid)) return false;
    if (armour) cmd_set_arg_item(cmdq_peek(), "item", armour);
    if (action == MAP_SET_TRAP || action == MAP_IMPROVE_TRAP)
        cmd_set_arg_choice(cmdq_peek(), "improve trap", action == MAP_IMPROVE_TRAP);
    if (action == MAP_EQUIP_LIGHT) cmd_set_arg_choice(cmdq_peek(), "light source", 1);
    if ((action == MAP_OPEN_CHEST || action == MAP_DISARM_CHEST) && loc_eq(grid, player->grid))
        cmd_set_arg_direction(cmdq_peek(), "direction", DIR_TARGET);
    return true;
}

bool web_quick_action(int key)
{
    int direction = key - '0';
    cmd_code command;
    if (direction >= DIR_SW && direction <= DIR_NE) {
        command = direction == DIR_TARGET ? CMD_HOLD : CMD_WALK;
    } else if (player->timed[TMD_COMMAND]) {
        if (key == 'r') command = CMD_READ_SCROLL;
        else if (key == 'm') command = CMD_CAST;
        else if (key == 'd') command = CMD_DROP;
        else return false;
    } else if (key == 'A') {
        const term *map = angband_term[WEB_MAP_TERM];
        return web_act_on_map_cell((player->grid.x - map->offset_x) * tile_width,
            (player->grid.y - map->offset_y) * tile_height, MAP_BREATHE);
    } else return false;
    int keymap = OPT(player, rogue_like_commands) ? KEYMAP_MODE_ROGUE : KEYMAP_MODE_ORIG;
    if (!key_confirm_command(cmd_lookup_key(command, keymap)) || cmdq_push(command)) return false;
    if (command == CMD_WALK) cmd_set_arg_direction(cmdq_peek(), "direction", direction);
    return true;
}

void web_run_direction(int direction)
{
    if (direction < DIR_SW || direction > DIR_NE || direction == DIR_TARGET) return;
    int keymap = OPT(player, rogue_like_commands) ? KEYMAP_MODE_ROGUE : KEYMAP_MODE_ORIG;
    if (!key_confirm_command(cmd_lookup_key(CMD_RUN, keymap)) || cmdq_push(CMD_RUN)) return;
    cmd_set_arg_direction(cmdq_peek(), "direction", direction);
    pace_run = true;
}

EM_JS(bool, take_interrupt, (bool exploring, bool resting), {
    return Module['takeInterrupt'](exploring, resting);
});

void web_poll_interrupt(void)
{
    bool exploring = player->upkeep->exploring;
    bool resting = player_is_resting(player) &&
            (!exploring || !player_is_fully_rested(player));
    if (!exploring && !player->upkeep->running && !resting && cmd_get_nrepeats() <= 0) return;
    double now = emscripten_get_now();
    if ((pace_run && player->upkeep->running) || (exploring && !resting)) {
        if (web_has_overhead_map()) {
            term *map = angband_term[WEB_MAP_TERM];
            handle_stuff(player);
            term *previous = Term;
            Term_activate(map);
            Term_fresh();
            Term_activate(previous);
        }
        last_interrupt_poll = now;
        emscripten_sleep(exploring ? EXPLORE_STEP_DELAY_MS : RUN_STEP_DELAY_MS);
    } else if (now - last_interrupt_poll >= 16) {
        last_interrupt_poll = now;
        emscripten_sleep(1);
    }
    if (take_interrupt(player->upkeep->exploring, resting)) {
        if (player->upkeep->exploring) {
            if (player->upkeep->explore_discovery) clear_explore_marks(player);
            player->upkeep->explore_discovery = false;
            disturb(player);
            msg("Cancelled.");
        } else {
            Term_keypress(ESCAPE, 0);
        }
    }
}

EM_JS(int, take_input, (int *code, int *x, int *y, int row, int preview, int section,
        int store_action, int aim_cell, int target_cell, int map_cell, int map_action,
        int buy_stat, int sell_stat, int tiles_event, int name_event, int history_event,
        int text_event, int delete_event, int run_direction, int character_event, int new_game, int quick_action, int button), {
    const event = Module['takeInput']();
    if (!event) return 0;
    if (event.mouseAvailable !== undefined) Module['mouseAvailable'] = event.mouseAvailable;
    HEAP32[code >>> 2] = event.code ?? 0;
    if (event.type === "key") {
        HEAP32[x >>> 2] = event.mods ?? 0;
    } else if (event.type === "store-action") {
        HEAP32[x >>> 2] = event.row ?? 0;
    } else if (event.x !== undefined) {
        HEAP32[x >>> 2] = event.x;
        HEAP32[y >>> 2] = event.y;
    }
    switch (event.type) {
        case "key": return event.command ? button : 1;
        case "run-direction": return run_direction;
        case "quick-action": return quick_action;
        case "open-character": return character_event;
        case "submit-name":
            Module['submittedText'] = event.value;
            HEAP32[code >>> 2] = 0;
            return name_event;
        case "submit-history":
            Module['submittedText'] = event.value;
            return history_event;
        case "submit-text":
            Module['submittedText'] = event.value;
            return text_event;
        case "random-name":
            HEAP32[code >>> 2] = 1;
            return name_event;
        case "menu-row": return row;
        case "menu-preview": return preview;
        case "delete-save": return delete_event;
        case "new-game": return new_game;
        case "menu-section": return section;
        case "store-action": return store_action;
        case "aim-cell": return aim_cell;
        case "target-cell": return target_cell;
        case "map-cell": return map_cell;
        case "map-action": return map_action;
        case "buy-stat": return buy_stat;
        case "sell-stat": return sell_stat;
        case "set-tiles": return tiles_event;
        default: return 0;
    }
});

EM_ASYNC_JS(int, wait_for_event, (const char *mode, int x, int y, int width, int height, int playing,
        const char *prompt, const char *title, const char *warning, const char *verb, int player_x, int player_y, int gold, int world_view,
        bool new_messages, int save_event), {
    const region = width ? { x, y, width, height } : undefined;
    const modeName = UTF8ToString(mode);
    const context = modeName === "target" ? { ...Module['targetOptions'] } :
        modeName === "more" ? {} : Module['inputContext'] ?? {};
    const stores = Module['storeMenus'];
    const store = modeName === "more" ? stores?.at(-1) : null;
    const menu = modeName === "menu" || modeName === "save-slots" ? Module['inputMenu'] :
        store ? { ...store, store: { ...store.store, gold } } : undefined;
    if (modeName !== "more") {
        if (Module['characterSheet']) context.character = Module['characterSheet'];
        Module['inputContext'] = Module['inputMenu'] = Module['characterSheet'] = undefined;
    }
    if (modeName === "menu" && menu?.store) {
        menu.store.gold = gold;
        if (stores?.length) stores[stores.length - 1] = menu;
    }
    if (prompt) context.prompt = UTF8ToString(prompt);
    if (title) context.textTitle = UTF8ToString(title);
    if (warning) context.castWarning = UTF8ToString(warning);
    if (verb) context.verb = UTF8ToString(verb);
    if (playing && modeName !== "more") context.actionMessages = Module['actionMessages'];
    if (new_messages) {
        if (modeName === "more") context.pausedMessages = Module['actionMessages'];
        else context.newMessages = true;
    }
    if (player_x >= 0) context.player = { x: player_x, y: player_y };
    context.worldView = !!world_view;
    const action = await Module['waitForInput'](modeName, region, !!playing,
        context, menu);
    switch (action) {
        case "background-save": return save_event;
        default: return 0;
    }
});

EM_JS(void, flush_input, (void), {
    Module['flushInput']();
});

EM_ASYNC_JS(int, persist_profile, (int saved, int outcome, int automatic, const char *path), {
    Module['saveSlot'] = UTF8ToString(path).split("/").pop();
    return (await Module['persistProfile'](!!saved, !!outcome, !!automatic)) ? 1 : 0;
});

bool web_persist_profile(bool saved)
{
    bool automatic = player && !player->is_dead && (background_save || player->upkeep->autosave);
    background_save = false;
    return persist_profile(saved, player && player->is_dead, automatic, savefile);
}

EM_ASYNC_JS(bool, web_sync_profile, (void), {
    return await Module['syncProfile']();
});

EM_ASYNC_JS(int, delete_save_file, (const char *path, const char *panic), {
    return await Module['deleteSaveFile'](UTF8ToString(path), panic ? UTF8ToString(panic) : null);
});

bool web_delete_save_file(const char *path, const char *panic)
{
    return delete_save_file(path, panic);
}

static ui_event_type wait_for_input(void)
{
    bool map_visible = textui_map_is_visible();
    bool playing = player && character_generated && player->upkeep->playing && !player->is_dead;
    enum web_input_mode mode = input_mode;
    int x = 0, y = 0, width = 0, height = 0;
    int player_x = -1, player_y = -1;
    if (mode == WEB_INPUT_TERMINAL && playing && character_dungeon && inkey_flag && map_visible) {
        mode = WEB_INPUT_COMMAND;
    }
    if (mode == WEB_INPUT_TARGET && !map_visible) mode = WEB_INPUT_DETAILS;
    if (mode == WEB_INPUT_DIRECTION && direction_command == CMD_RUN) mode = WEB_INPUT_RUN_DIRECTION;
    pace_run = mode == WEB_INPUT_RUN_DIRECTION;

    bool new_messages = (playing || mode == WEB_INPUT_MORE) && web_has_pending_messages();
    if (mode != WEB_INPUT_MORE) web_mark_messages_displayed();
    bool aiming = mode == WEB_INPUT_TARGET || mode == WEB_INPUT_AIM ||
        mode == WEB_INPUT_DIRECTION || mode == WEB_INPUT_RUN_DIRECTION;
    const char *warning = mode == WEB_INPUT_CONFIRM ? cast_warning : NULL;
    bool world_view = playing && web_has_overhead_map() &&
        (mode == WEB_INPUT_COMMAND || mode == WEB_INPUT_AIM || mode == WEB_INPUT_MORE ||
            mode == WEB_INPUT_RUN_DIRECTION || warning);
    if (mode == WEB_INPUT_CHARACTER ||
            (playing && (mode == WEB_INPUT_COMMAND || mode == WEB_INPUT_MENU || world_view ||
                (aiming && map_visible) || new_messages)))
        publish_world(mode == WEB_INPUT_COMMAND);
    if (playing && aiming && map_visible) web_character_sheet(false);
    if ((mode == WEB_INPUT_COMMAND || mode == WEB_INPUT_AIM || mode == WEB_INPUT_RUN_DIRECTION) && world_view) {
        const term *map = angband_term[WEB_MAP_TERM];
        width = MIN(map->wid, (cave->width - map->offset_x) * tile_width);
        height = MIN(map->hgt, (cave->height - map->offset_y) * tile_height);
    } else if (mode == WEB_INPUT_TARGET || mode == WEB_INPUT_LOCATE || (map_visible && aiming)) {
        x = COL_MAP;
        y = ROW_MAP;
        width = SCREEN_WID * tile_width;
        height = SCREEN_HGT * tile_height;
        if (mode != WEB_INPUT_TARGET) {
            player_x = x + (player->grid.x - Term->offset_x) * tile_width;
            player_y = y + (player->grid.y - Term->offset_y) * tile_height;
        }
    } else if (mode == WEB_INPUT_MENU || mode == WEB_INPUT_SAVE_SLOTS) {
        width = Term->wid;
        height = Term->hgt;
    }
    const char *verb = direction_command == CMD_FIRE ? "Fire" :
        direction_command == CMD_THROW ? "Throw" : direction_command == CMD_CAST ? "Cast" : "Use";
    int event = wait_for_event(input_modes[mode], x, y, width, height, playing, input_prompt,
        mode == WEB_INPUT_TEXT && text_entry ? text_entry->title : NULL, warning,
        mode == WEB_INPUT_AIM || mode == WEB_INPUT_TARGET ? verb : NULL, player_x, player_y,
        player ? player->au : 0, world_view, new_messages, EVT_WEB_SAVE);
    if (event == EVT_WEB_SAVE) background_save = true;
    return event;
}

static errr queue_input(void)
{
    int code = 0, x = 0, y = 0;
    ui_event_type type = take_input(&code, &x, &y, EVT_WEB_MENU_ROW, EVT_WEB_MENU_PREVIEW,
        EVT_WEB_MENU_SECTION, EVT_WEB_STORE_ACTION, EVT_WEB_AIM_CELL, EVT_WEB_TARGET_CELL,
        EVT_WEB_MAP_CELL, EVT_WEB_MAP_ACTION, EVT_WEB_BUY_STAT, EVT_WEB_SELL_STAT, EVT_WEB_TILES,
        EVT_WEB_NAME, EVT_WEB_HISTORY, EVT_WEB_TEXT, EVT_WEB_DELETE, EVT_WEB_RUN_DIRECTION,
        EVT_WEB_CHARACTER, EVT_WEB_NEW_GAME, EVT_WEB_QUICK_ACTION, EVT_BUTTON);

    if (type == EVT_NONE) return 1;
    if (type != EVT_WEB_TILES) {
        if (input_mode == WEB_INPUT_MORE) web_mark_messages_displayed();
        web_clear_displayed_messages();
    }

    switch (type) {
        case EVT_KBRD:
        case EVT_BUTTON: return Term_keypress_as(type, code, x);
        case EVT_WEB_AIM_CELL:
        case EVT_WEB_MAP_CELL:
        case EVT_WEB_MAP_ACTION:
        case EVT_WEB_TARGET_CELL: {
            const ui_event action = { .mouse = { .type = type, .x = x, .y = y,
                .button = type == EVT_WEB_MAP_CELL || type == EVT_WEB_MAP_ACTION ||
                    (type == EVT_WEB_AIM_CELL && input_mode == WEB_INPUT_AIM) ? code : 1 } };
            return Term_event_push(&action);
        }
        case EVT_WEB_STORE_ACTION: {
            const ui_event action = { .store_action = { .type = type, .row = x, .key = code } };
            return Term_event_push(&action);
        }
        default: {
            const ui_event action = { .key = { .type = type, .code = code } };
            return Term_event_push(&action);
        }
    }
}

static errr web_xtra(int action, int value)
{
    switch (action) {
        case TERM_XTRA_EVENT: {
            if (!queue_input()) return 0;
            if (!value) return 1;
            ui_event_type type = wait_for_input();
            if (type != EVT_NONE) {
                const ui_event action = { .key = { .type = type } };
                return Term_event_push(&action);
            }
            return queue_input();
        }
        case TERM_XTRA_FLUSH:
            flush_input();
            return 0;
        case TERM_XTRA_FRESH: {
            const term_win *screen = Term->old;
            int cursor = screen->cv && !screen->cu ? screen->cy * Term->wid + screen->cx : -1;
            bool tiles = use_graphics != GRAPHICS_NONE;
            bool map = Term == angband_term[WEB_MAP_TERM];
            int x = 0, y = 0, place = -1;
            if (map && player && character_dungeon) {
                x = (player->grid.x - Term->offset_x) * tile_width;
                y = (player->grid.y - Term->offset_y) * tile_height;
                place = player->place;
            }
            send_frame(map, Term->wid, Term->hgt, screen->vc, screen->va,
                tiles ? screen->vtc : NULL, tiles ? screen->vta : NULL,
                &angband_color_table[0][0], MAX_COLORS, MULT_BG, COLOUR_SHADE, cursor, use_graphics, x, y, place);
            return 0;
        }
        case TERM_XTRA_DELAY:
            if (value > 0) {
                term *map = angband_term[WEB_MAP_TERM];
                if (Term != map && web_has_overhead_map()) {
                    term *previous = Term;
                    Term_activate(map);
                    Term_fresh();
                    Term_activate(previous);
                }
                emscripten_sleep(value);
            }
            return 0;
        case TERM_XTRA_CLEAR:
        case TERM_XTRA_REACT:
            return 0;
        default:
            return 1;
    }
}

static void init_terminal(term *terminal, int index, int width, int height)
{
    term_init(terminal, width, height, 256);
    terminal->fixed_shape = true;
    terminal->soft_cursor = true;
    terminal->never_bored = true;
    terminal->never_frosh = true;
    terminal->xtra_hook = web_xtra;
    angband_term[index] = terminal;
}

static bool web_confirm_debug(void)
{
    return get_check("Use debug commands?\n"
        "These commands are unsupported and may crash the game or corrupt your savefile.");
}

errr init_web(int argc, char **argv)
{
    static term terminal, map;
    (void)argc;
    (void)argv;
    if (!init_graphics_modes()) return 1;
    confirm_debug_hook = web_confirm_debug;
    init_terminal(&terminal, 0, 80, 24);
    init_terminal(&map, WEB_MAP_TERM, 1, 1);
    map.fixed_shape = false;
    Term_activate(&terminal);
    return 0;
}
