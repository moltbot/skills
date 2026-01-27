#!/bin/bash
# 本地模型故障转移演示脚本
# 模拟网络模型不可用，自动切换到本地 Ollama 模型

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 模型配置
NETWORK_MODEL="github-copilot/claude-opus-4.5"
LOCAL_MODELS=("qwen3:32b" "qwen2.5-coder:32b" "deepseek-r1:70b" "glm4:9b")

# 检查 Ollama 服务
check_ollama() {
    if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# 检查网络模型可用性（模拟）
check_network_model() {
    local simulate_failure="${1:-false}"
    
    if [ "$simulate_failure" = "true" ]; then
        return 1  # 模拟失败
    fi
    
    # 实际检查可以添加真实的 API 调用
    return 0
}

# 根据任务类型选择本地模型
select_local_model() {
    local task="$1"
    
    # 检测编程任务
    if echo "$task" | grep -qiE "代码|编程|函数|调试|debug|code|program|script|python|java|javascript|typescript|api|bug"; then
        echo "qwen2.5-coder:32b"
        return
    fi
    
    # 检测推理任务
    if echo "$task" | grep -qiE "推理|分析|证明|逻辑|数学|计算|reasoning|analysis|math|solve|算法"; then
        echo "deepseek-r1:70b"
        return
    fi
    
    # 检测轻量中文任务
    if echo "$task" | grep -qiE "翻译|总结|摘要|简单|快速|translate|summary"; then
        echo "glm4:9b"
        return
    fi
    
    # 默认使用通用模型
    echo "qwen3:32b"
}

# 调用本地模型
call_local_model() {
    local model="$1"
    local prompt="$2"
    
    echo -e "${CYAN}正在调用本地模型: $model${NC}"
    echo -e "${YELLOW}提示: $prompt${NC}"
    echo ""
    
    # 使用 Ollama API 调用
    response=$(echo "$prompt" | ollama run "$model" --nowordwrap 2>/dev/null | head -20)
    
    if [ -n "$response" ]; then
        echo -e "${GREEN}模型响应:${NC}"
        echo "$response"
        return 0
    else
        echo -e "${RED}模型响应失败${NC}"
        return 1
    fi
}

# 主函数：智能故障转移
smart_fallback() {
    local task="$1"
    local force_local="${2:-false}"
    
    echo ""
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║           本地模型故障转移演示 - Local Model Fallback        ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # 步骤1: 检查 Ollama 服务
    echo -e "${CYAN}[1/4] 检查 Ollama 服务状态...${NC}"
    if check_ollama; then
        echo -e "${GREEN}  ✓ Ollama 服务运行中${NC}"
    else
        echo -e "${RED}  ✗ Ollama 服务未运行，请先启动: ollama serve${NC}"
        exit 1
    fi
    
    # 步骤2: 检查网络模型
    echo -e "${CYAN}[2/4] 检查网络模型可用性...${NC}"
    if [ "$force_local" = "true" ]; then
        echo -e "${YELLOW}  ⚠ 强制使用本地模型模式${NC}"
        echo -e "${RED}  ✗ 网络模型: $NETWORK_MODEL (已禁用)${NC}"
    else
        if check_network_model "false"; then
            echo -e "${GREEN}  ✓ 网络模型: $NETWORK_MODEL (可用)${NC}"
            echo -e "${YELLOW}  → 使用 --force-local 参数强制使用本地模型${NC}"
            return 0
        else
            echo -e "${RED}  ✗ 网络模型: $NETWORK_MODEL (不可用)${NC}"
        fi
    fi
    
    # 步骤3: 选择本地模型
    echo -e "${CYAN}[3/4] 根据任务智能选择本地模型...${NC}"
    local selected_model=$(select_local_model "$task")
    echo -e "${GREEN}  → 任务: \"$task\"${NC}"
    echo -e "${GREEN}  → 选择模型: $selected_model${NC}"
    
    # 检查选中的模型是否可用
    if ! ollama list | grep -q "$selected_model"; then
        echo -e "${YELLOW}  ⚠ 首选模型不可用，切换到备用模型...${NC}"
        selected_model="qwen3:32b"  # 使用通用备用
    fi
    
    # 步骤4: 调用本地模型
    echo -e "${CYAN}[4/4] 调用本地模型处理任务...${NC}"
    echo ""
    echo -e "${BLUE}────────────────────────────────────────────────────────────────${NC}"
    
    call_local_model "$selected_model" "$task"
    
    echo -e "${BLUE}────────────────────────────────────────────────────────────────${NC}"
    echo ""
    echo -e "${GREEN}✓ 故障转移完成！本地模型已成功响应。${NC}"
}

# 显示帮助
show_help() {
    echo "用法: $0 [选项] \"任务描述\""
    echo ""
    echo "选项:"
    echo "  --force-local, -f    强制使用本地模型（模拟网络故障）"
    echo "  --help, -h           显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 \"帮我写一个Python函数\"                  # 正常模式"
    echo "  $0 --force-local \"帮我分析这段代码\"        # 强制本地模式"
    echo "  $0 -f \"解释一下这个数学公式\"               # 强制本地模式"
    echo ""
    echo "任务类型自动识别:"
    echo "  - 编程任务 → qwen2.5-coder:32b"
    echo "  - 推理任务 → deepseek-r1:70b"
    echo "  - 轻量中文 → glm4:9b"
    echo "  - 通用任务 → qwen3:32b"
}

# 入口
main() {
    local force_local="false"
    local task=""
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force-local|-f)
                force_local="true"
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                task="$1"
                shift
                ;;
        esac
    done
    
    if [ -z "$task" ]; then
        show_help
        exit 1
    fi
    
    smart_fallback "$task" "$force_local"
}

main "$@"
