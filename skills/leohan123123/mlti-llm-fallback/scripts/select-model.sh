#!/bin/bash
# 多模型智能选择脚本
# 触发指令: mlti llm
# 默认: 始终使用 Claude Opus 4.5

DEFAULT_MODEL="github-copilot/claude-opus-4.5"
TRIGGER_KEYWORD="mlti llm"

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# 检查是否包含触发指令
check_trigger() {
    local input="$1"
    if echo "$input" | grep -qi "mlti llm"; then
        return 0  # 包含触发指令
    else
        return 1  # 不包含
    fi
}

# 检查强制模型指令
check_force_model() {
    local input="$1"
    
    if echo "$input" | grep -qi "mlti llm coding"; then
        echo "qwen2.5-coder:32b"
        return 0
    fi
    
    if echo "$input" | grep -qi "mlti llm reasoning"; then
        echo "deepseek-r1:70b"
        return 0
    fi
    
    if echo "$input" | grep -qi "mlti llm chinese"; then
        echo "glm4:9b"
        return 0
    fi
    
    if echo "$input" | grep -qi "mlti llm general"; then
        echo "qwen3:32b"
        return 0
    fi
    
    return 1  # 无强制指令
}

# 根据任务类型选择本地模型
select_local_model() {
    local task="$1"
    
    # 移除触发指令后分析任务
    task=$(echo "$task" | sed -E 's/mlti llm (coding|reasoning|chinese|general)?//gi')
    
    # 检测编程任务
    if echo "$task" | grep -qiE "代码|编程|函数|调试|debug|code|program|script|python|java|javascript|typescript|api|bug|重构|refactor"; then
        echo "qwen2.5-coder:32b"
        return
    fi
    
    # 检测推理任务
    if echo "$task" | grep -qiE "推理|分析|证明|逻辑|数学|计算|reasoning|analysis|math|solve|算法|evaluate"; then
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

# 主函数
main() {
    local input="$1"
    
    if [ -z "$input" ]; then
        echo "用法: $0 \"你的任务\""
        echo ""
        echo "默认使用 Claude Opus 4.5"
        echo "使用 'mlti llm' 指令启动多模型选择"
        echo ""
        echo "示例:"
        echo "  $0 \"帮我写代码\"                    -> Claude Opus 4.5"
        echo "  $0 \"mlti llm 帮我写代码\"           -> qwen2.5-coder:32b"
        echo "  $0 \"mlti llm coding 任意任务\"      -> qwen2.5-coder:32b"
        exit 1
    fi
    
    # 检查是否包含触发指令
    if ! check_trigger "$input"; then
        # 无触发指令，使用默认模型
        echo -e "${GREEN}选择模型: $DEFAULT_MODEL${NC}"
        echo -e "${CYAN}原因: 默认使用最强模型（未使用 mlti llm 指令）${NC}"
        exit 0
    fi
    
    # 包含触发指令，检查是否有强制模型
    forced_model=$(check_force_model "$input")
    if [ -n "$forced_model" ]; then
        echo -e "${YELLOW}选择模型: $forced_model${NC}"
        echo -e "${CYAN}原因: 使用强制指令指定模型${NC}"
        exit 0
    fi
    
    # 智能选择本地模型
    selected_model=$(select_local_model "$input")
    
    # 确定原因
    case "$selected_model" in
        "qwen2.5-coder:32b")
            reason="检测到编程任务"
            ;;
        "deepseek-r1:70b")
            reason="检测到推理任务"
            ;;
        "glm4:9b")
            reason="检测到轻量中文任务"
            ;;
        *)
            reason="使用通用模型"
            ;;
    esac
    
    echo -e "${YELLOW}选择模型: $selected_model${NC}"
    echo -e "${CYAN}原因: $reason (mlti llm 已触发)${NC}"
}

main "$@"
